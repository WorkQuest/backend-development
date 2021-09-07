import { Op } from 'sequelize';
import { error, handleValidationError, output } from "../utils";
import { Errors } from '../utils/errors';
import { getMedias } from "../utils/medias"
import {
  User,
  UserRole,
  Quest,
  QuestStatus,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
  StarredQuests,
} from "@workquest/database-models/lib/models";
import { locationForValidateSchema } from "@workquest/database-models/lib/schemes";
import { transformToGeoPostGIS } from "@workquest/database-models/lib/utils/quest"
import * as sequelize from "sequelize";
import { Location } from "@workquest/database-models/src/models/index"; // TODO to index.ts

export const searchFields = [
  "title",
  "description",
];

async function answerWorkOnQuest(questId: string, worker: User, acceptWork: boolean) {
  const quest = await Quest.findByPk(questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  worker.mustHaveRole(UserRole.Worker);
  quest.mustHaveStatus(QuestStatus.WaitWorker);
  quest.mustBeAppointedOnQuest(worker.id);

  if (acceptWork) {
    await quest.update({ status: QuestStatus.Active });
  } else {
    await quest.update({ status: QuestStatus.Created, assignedWorkerId: null });
  }
}

export async function getQuest(r) {
  const quest = await Quest.findOne({
    where: { id: r.params.questId },
    include: [{
      model: StarredQuests,
      as: "star",
      where: { userId: r.auth.credentials.id },
      required: false
    }, {
      model: QuestsResponse,
      as: "response",
      where: { workerId: r.auth.credentials.id },
      required: false
    }]
  });

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  return output(quest);
}

export async function createQuest(r) {
  const user = r.auth.credentials;
  const medias = await getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  user.mustHaveRole(UserRole.Employer);

  const quest = await Quest.create({
    userId: user.id,
    status: QuestStatus.Created,
    category: r.payload.category,
    employment: r.payload.employment,
    priority: r.payload.priority,
    locationPlaceName: r.payload.locationPlaceName,
    location: r.payload.location,
    locationPostGIS: transformToGeoPostGIS(r.payload.location),
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
  }, { transaction });

  await quest.$set('medias', medias, { transaction });

  await transaction.commit();

  return output(
    await Quest.findByPk(quest.id)
  )
}

export async function editQuest(r) {
  if (r.payload.location || r.payload.locationPlaceName) {
    const locationValidate = locationForValidateSchema.validate(r.payload);

    if (locationValidate.error) {
      return handleValidationError(r, null, locationValidate.error);
    }
  }

  const quest = await Quest.findByPk(r.params.questId);
  const transaction = await r.server.app.db.transaction();

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustBeQuestCreator(r.auth.credentials.id);
  quest.mustHaveStatus(QuestStatus.Created);

  if (r.payload.medias) {
    const medias = await getMedias(r.payload.medias);

    await quest.$set('medias', medias, { transaction });
  }
  if (r.payload.location) {
    r.payload.locationPostGIS = transformToGeoPostGIS(r.payload.location);
  }

  await quest.update(r.payload, { transaction });

  await transaction.commit();

  return output(
    await Quest.findByPk(quest.id)
  )
}

export async function deleteQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  const transaction = await r.server.app.db.transaction();

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustBeQuestCreator(r.auth.credentials.id);

  if (quest.status !== QuestStatus.Created && quest.status !== QuestStatus.Closed) {
    return error(Errors.InvalidStatus, "Quest cannot be deleted at current stage", {});
  }

  await QuestsResponse.destroy({ where: { questId: quest.id }, transaction })
  await quest.destroy({ force: true, transaction });

  await transaction.commit();

  return output();
}

export async function closeQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  const transaction = await r.server.app.db.transaction();

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustHaveStatus(QuestStatus.Created, QuestStatus.WaitConfirm);
  quest.mustBeQuestCreator(r.auth.credentials.id);

  await quest.update({ status: QuestStatus.Closed }, { transaction });

  await QuestsResponse.update({ status: QuestsResponseStatus.Closed }, {
    where: { questId: quest.id }, transaction });

  await transaction.commit();

  return output();
}

export async function startQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  const assignedWorker = await User.findByPk(r.payload.assignedWorkerId);
  const transaction = await r.server.app.db.transaction();

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (!assignedWorker) {
    return error(Errors.NotFound, 'Assigned user is not found', {});
  }

  quest.mustBeQuestCreator(r.auth.credentials.id);
  quest.mustHaveStatus(QuestStatus.Created);

  const questResponse = await QuestsResponse.findOne({
    where: {
      workerId: assignedWorker.id
    }
  });

  if (!questResponse) {
    return error(Errors.NotFound, "Assigned user did not respond on quest", {});
  }
  if (questResponse.type === QuestsResponseType.Response) {
    questResponse.mustHaveStatus(QuestsResponseStatus.Open);
  } else if (questResponse.type === QuestsResponseType.Invite) {
    questResponse.mustHaveStatus(QuestsResponseStatus.Accepted);
  }

  await quest.update({ assignedWorkerId: assignedWorker.id, status: QuestStatus.WaitWorker },
    { transaction });

  await QuestsResponse.update({ status: QuestsResponseStatus.Closed }, {
    where: {
      questId: quest.id,
      id: {
        [Op.ne]: questResponse.id
      }
  }, transaction });

  await transaction.commit()

  return output();
}

export async function rejectWorkOnQuest(r) {
  await answerWorkOnQuest(r.params.questId, r.auth.credentials, false);

  return output();
}

export async function acceptWorkOnQuest(r) {
  await answerWorkOnQuest(r.params.questId, r.auth.credentials, true);

  return output();
}

export async function completeWorkOnQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustHaveStatus(QuestStatus.Active);
  quest.mustBeAppointedOnQuest(r.auth.credentials.id);

  await quest.update({ status: QuestStatus.WaitConfirm });

  return output();
}

export async function acceptCompletedWorkOnQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustBeQuestCreator(r.auth.credentials.id);
  quest.mustHaveStatus(QuestStatus.WaitConfirm);

  await quest.update({ status: QuestStatus.Done });

  return output();
}

export async function rejectCompletedWorkOnQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustBeQuestCreator(r.auth.credentials.id);
  quest.mustHaveStatus(QuestStatus.WaitConfirm);

  await quest.update({ status: QuestStatus.Dispute });

  return output();
}

export async function getQuests(r) {
  const entersAreaLiteral = sequelize.literal(
    'st_within("locationPostGIS", st_makeenvelope(:northLng, :northLat, :southLng, :southLat, 4326))'
  );
  const order = [];
  const include = [];
  const where = {
    ...(r.query.performing && { assignedWorkerId: r.auth.credentials.id } ),
    ...(r.query.priority && { priority: r.query.priority }),
    ...(r.query.status && { status: r.query.status }),
    ...(r.query.adType && {adType: r.query.adType}),
    ...(r.params.userId && { userId: r.params.userId }),
    ...(r.query.north && r.query.south && { [Op.and]: entersAreaLiteral }),
  };

  if (r.query.q) {
    where[Op.or] = searchFields.map(field => ({
      [field]: {
        [Op.iLike]: `%${r.query.q}%`
      }
    }))
  }
  if (r.query.invited) {
    include.push({
      model: QuestsResponse,
      as: 'responses',
      attributes: [],
        where: {
        [Op.and]: [
          { workerId: r.auth.credentials.id },
          { type: QuestsResponseType.Invite },
        ]
      }
    });
  }
  if (r.query.starred) {
    include.push({
      model: StarredQuests,
      as: 'starredQuests',
      where: { userId: r.auth.credentials.id },
      attributes: [],
    });
  }

  include.push({
    model: StarredQuests,
    as: "star",
    where: { userId: r.auth.credentials.id },
    required: false
  });
  include.push({
    model: QuestsResponse,
    as: "response",
    where: { workerId: r.auth.credentials.id },
    required: false
  });

  for (const [key, value] of Object.entries(r.query.sort)) {
    order.push([key, value]);
  }

  const { count, rows } = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    include, order, where,
    replacements: {
      ...(r.query.north && r.query.south && {
        northLng: r.query.north.longitude,
        northLat: r.query.north.latitude,
        southLng: r.query.south.longitude,
        southLat: r.query.south.latitude,
      })
    }
  });

  return output({count, quests: rows});
}

export async function getMyStarredQuests(r) {
  return output(
    await StarredQuests.findAll({
      where: { userId: r.auth.credentials.id },
      attributes: [],
      include: {
        model: Quest
      }
    })
  )
}

export async function setStar(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  const starred = await StarredQuests.findOne({
    where: {
      userId: r.auth.credentials.id,
      questId: r.params.questId,
    }
  });

  if (starred) {
    return error(Errors.Forbidden, 'Quest has already been added to favorites', {});
  }

  await StarredQuests.create({
    userId: r.auth.credentials.id,
    questId: r.params.questId,
  });

  return output();
}

export async function removeStar(r) {
  await StarredQuests.destroy({
    where: {
      userId: r.auth.credentials.id,
      questId: r.params.questId,
    }
  });

  return output();
}
