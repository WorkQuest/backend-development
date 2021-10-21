import { Op, literal } from 'sequelize';
import { Errors } from '../utils/errors';
import { UserController } from "../controllers/user";
import { QuestController } from "../controllers/quest";
import { transformToGeoPostGIS } from "../utils/postGIS";
import { error, handleValidationError, output } from "../utils";
import { splitSpecialisationAndIndustry } from "../utils/filters";
import { locationForValidateSchema } from "@workquest/database-models/lib/schemes";
import {
  User,
  Quest,
  UserRole,
  QuestStatus,
  StarredQuests,
  QuestsResponse,
  QuestsResponseType,
  QuestsResponseStatus,
  QuestSpecializationFilter,
} from "@workquest/database-models/lib/models";

export const searchFields = [
  "title",
  "description",
];

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
  const employer: User = r.auth.credentials;
  const userController = new UserController(employer.id, employer);

  await userController.userMustHaveRole(UserRole.Employer);

  const transaction = await r.server.app.db.transaction();

  const quest = await Quest.create({
    userId: employer.id,
    status: QuestStatus.Created,
    category: r.payload.category,
    workplace: r.payload.workplace,
    employment: r.payload.employment,
    priority: r.payload.priority,
    location: r.payload.location,
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
    medias: r.payload.medias,
    adType: r.payload.adType,
    locationPlaceName: r.payload.locationPlaceName,
    locationPostGIS: transformToGeoPostGIS(r.payload.location),
  }, { transaction });

  const questController = new QuestController(quest.id, quest, transaction);

  await questController.setMedias(r.payload.medias);
  await questController.setQuestSpecializations(r.payload.specializationKeys, true);

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

  const employer: User = r.auth.credentials;

  const questValues = {
    ...(r.payload.price && { price: r.payload.price }),
    ...(r.payload.title && { title: r.payload.title }),
    ...(r.payload.adType && { adType: r.payload.adType }),
    ...(r.payload.priority && { priority: r.payload.priority }),
    ...(r.payload.category && { category: r.payload.category }),
    ...(r.payload.workplace && { workplace: r.payload.workplace }),
    ...(r.payload.employment && { employment: r.payload.employment }),
    ...(r.payload.description && { description: r.payload.description }),
    ...(r.payload.location && {
      location: r.payload.location,
      locationPlaceName: r.payload.locationPlaceName,
      locationPostGIS: transformToGeoPostGIS(r.payload.location),
    }),
  };

  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await questController.employerMustBeQuestCreator(employer.id);
  await questController.questMustHaveStatus(QuestStatus.Created);

  const transaction = await r.server.app.db.transaction();

  questController.setTransaction(transaction);

  if (r.payload.medias) {
    await questController.setMedias(r.payload.medias);
  }
  if (r.payload.specializationKeys) {
    await questController.setQuestSpecializations(r.payload.specializationKeys);
  }

  await questController.updateFieldLocationPostGIS();

  await quest.update(questValues, { transaction });

  await transaction.commit();

  return output(
    await Quest.findByPk(quest.id)
  );
}

export async function deleteQuest(r) {
  const employer: User = r.auth.credentials;
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();
  const transaction = await r.server.app.db.transaction();

  questController.setTransaction(transaction);

  await questController.employerMustBeQuestCreator(employer.id);
  await questController.questMustHaveStatus(QuestStatus.Created, QuestStatus.Closed)

  await QuestSpecializationFilter.destroy({ where: { questId: quest.id }, transaction });
  await QuestsResponse.destroy({ where: { questId: quest.id }, transaction })
  await quest.destroy({ force: true, transaction });

  await transaction.commit();

  return output();
}

export async function closeQuest(r) {
  const employer: User = r.auth.credentials;
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();
  const transaction = await r.server.app.db.transaction();

  await questController.employerMustBeQuestCreator(employer.id);
  await questController.questMustHaveStatus(QuestStatus.Created, QuestStatus.WaitConfirm);

  await quest.update({ status: QuestStatus.Closed }, { transaction });

  await QuestsResponse.update({ status: QuestsResponseStatus.Closed }, {
    where: { questId: quest.id }, transaction });

  await transaction.commit();

  return output();
}

export async function startQuest(r) {
  const employer: User = r.auth.credentials;
  const questController = new QuestController(r.params.questId);
  const userController = new UserController(r.payload.assignedWorkerId);
  const quest = await questController.findModel();
  const assignedWorker = await userController.findModel();
  const transaction = await r.server.app.db.transaction();

  questController.setTransaction(transaction);
  userController.setTransaction(transaction);

  await questController.employerMustBeQuestCreator(employer.id);
  await questController.questMustHaveStatus(QuestStatus.Created);

  const questResponse = await QuestsResponse.findOne({
    where: { workerId: assignedWorker.id }
  });

  // TODO в контроллер
  if (!questResponse) {
    await transaction.rollback();

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
      id: { [Op.ne]: questResponse.id }
  }, transaction });

  await transaction.commit()

  return output();
}

export async function rejectWorkOnQuest(r) {
  const worker: User = r.auth.credentials;

  await QuestController.answerWorkOnQuest(r.params.questId, worker, false);

  return output();
}

export async function acceptWorkOnQuest(r) {
  const worker: User = r.auth.credentials;

  await QuestController.answerWorkOnQuest(r.params.questId, worker, true);

  return output();
}

export async function completeWorkOnQuest(r) {
  const worker: User = r.auth.credentials;
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await questController.questMustHaveStatus(QuestStatus.Active);
  await questController.workerMustBeAppointedOnQuest(worker.id);

  await quest.update({ status: QuestStatus.WaitConfirm });

  return output();
}

export async function acceptCompletedWorkOnQuest(r) {
  const employer: User = r.auth.credentials;
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await questController.employerMustBeQuestCreator(employer.id);
  await questController.questMustHaveStatus(QuestStatus.WaitConfirm);

  await quest.update({ status: QuestStatus.Done });

  return output();
}

export async function rejectCompletedWorkOnQuest(r) {
  const employer: User = r.auth.credentials;
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await questController.employerMustBeQuestCreator(employer.id);
  await questController.questMustHaveStatus(QuestStatus.WaitConfirm);

  await quest.update({ status: QuestStatus.Dispute });

  return output();
}

export async function getQuests(r) {
  const entersAreaLiteral = literal(
    'st_within("Quest"."locationPostGIS", st_makeenvelope(:northLng, :northLat, :southLng, :southLat, 4326))'
  );
  const order = [];
  const include = [];
  const where = {
    ...(r.query.status && { status: r.query.status }),
    ...(r.query.adType && { adType: r.query.adType }),
    ...(r.query.filter && { filter: r.params.filter }),
    ...(r.params.userId && { userId: r.params.userId }),
    ...(r.query.performing && { assignedWorkerId: r.auth.credentials.id }),
    ...(r.query.north && r.query.south && { [Op.and]: entersAreaLiteral }),
    ...(r.query.priorities && { priorities: {[Op.in]: r.query.priorities } }),
    ...(r.query.workplaces && { workplaces: { [Op.in]: r.query.workplaces } }),
    ...(r.query.employments && { employments: { [Op.in]: r.params.employments } }),
  };

  if (r.query.q) {
    where[Op.or] = searchFields.map(field => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` }
    }));
  }
  if (r.query.invited) {
    include.push({
      model: QuestsResponse,
      as: 'invited',
      attributes: [],
      required: true,
      where: {
        [Op.and]: [
          { workerId: r.auth.credentials.id },
          { type: QuestsResponseType.Invite },
        ]
      }
    });
  }
  if (r.query.responded) {
    include.push({
      model: QuestsResponse,
      as: "responded",
      attributes: [],
      required: true,
      where: {
        [Op.and]: [
          { workerId: r.auth.credentials.id },
          { type: QuestsResponseType.Response },
        ]
      },
    });
  }
  if (r.query.specializations) {
    const { specializationKeys, industryKeys } = splitSpecialisationAndIndustry(r.query.specializations);

    include.push({
      model: QuestSpecializationFilter,
      as: 'questIndustryForFiltering',
      attributes: [],
      where: { industryKey: { [Op.in]: industryKeys } }
    });

    if (specializationKeys.length > 0) {
      include.push({
        model: QuestSpecializationFilter,
        as: 'questSpecializationForFiltering',
        attributes: [],
        where: { specializationKey: { [Op.in]: specializationKeys } }
      });
    }
  }

  include.push({
    model: StarredQuests,
    as: "star",
    where: { userId: r.auth.credentials.id },
    required: r.query.starred,
  });

  // {
  //   model: QuestsResponse,
  //     as: 'responses',
  //   required: false,
  //   where: { '$"Quest"."userId"$': r.auth.credentials.id },
  // }

  for (const [key, value] of Object.entries(r.query.sort)) {
    order.push([key, value]);
  }

  const { count, rows } = await Quest.findAndCountAll({
    distinct: true,
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

  return output({ count, quests: rows });
}

// TODO Удалить?
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
  const questController = new QuestController(r.params.questId);

  await questController.findModel();

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
  const starredQuest = await StarredQuests.findOne({
    where: {
      userId: r.auth.credentials.id,
      questId: r.params.questId,
    }
  });

  if (!starredQuest) {
    return error(Errors.Forbidden, 'Quest or quest with star not fount', {});
  }

  await starredQuest.destroy();

  return output();
}
