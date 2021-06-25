import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { Quest, QuestStatus } from '../models/Quest';
import { User, UserRole } from '../models/User';
import { Op } from 'sequelize';
import { Media } from '../models/Media';
import { isMediaExists } from '../utils/storageService';
import { transformToGeoPostGIS } from '../utils/quest';
import { QuestsResponse, QuestsResponseStatus, QuestsResponseType } from '../models/QuestsResponse';

export const searchFields = [
  "title",
  "description",
];

async function getMedia(mediaId: string): Promise<Media> {
  const media = await Media.findByPk(mediaId);
  if (!media) {
    throw error(Errors.NotFound, 'Media is not found', { mediaId })
  }
  if (!await isMediaExists(media)) {
    throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
  }

  return media;
}

async function getMedias(mediaIds: string[]) {
  const medias = [];
  for (const id of mediaIds) {
    medias.push(await getMedia(id));
  }

  return medias;
}

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

export async function createQuest(r) {
  const user = r.auth.credentials;
  const medias = await getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  user.mustHaveRole(UserRole.Employer);

  const quest = await Quest.create({
    userId: user.id,
    status: QuestStatus.Created,
    category: r.payload.category,
    priority: r.payload.priority,
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

  quest.updateFieldLocationPostGIS();

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
  const order = [];
  const include = [];
  const where = {
    ...(r.query.performing && { assignedWorkerId: r.auth.credentials.id } ),
    ...(r.query.priority && { priority: r.query.priority }),
    ...(r.query.status && { status: r.query.status }),
    ...(r.params.fromUser && { userId: r.params.fromUser }),
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
      attributes: [],
        where: {
        [Op.and]: [
          { workerId: r.auth.credentials.id },
          { type: QuestsResponseType.Invite },
        ]
      }
    });
  }

  for (const [key, value] of Object.entries(r.query.sort)) {
    order.push([key, value]);
  }

  const { count, rows } = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    where, order, include,
  });

  return output({count, quests: rows});
}
