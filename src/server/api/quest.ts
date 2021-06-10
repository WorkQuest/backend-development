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

export async function createQuest(r) {
  const user = r.auth.credentials;
  const medias = await getMedias(r.payload.medias);

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
  });

  await quest.$set('medias', medias);

  return output(
    await Quest.findByPk(quest.id)
  )
}

export async function editQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustBeQuestCreator(r.auth.credentials.id);
  quest.mustHaveStatus(QuestStatus.Created);

  if (r.payload.medias) {
    const medias = await getMedias(r.payload.medias);

    await quest.$set('medias', medias);
  }

  quest.updateFieldLocationPostGIS();

  await quest.update(r.payload);

  return output(
    await Quest.findByPk(quest.id)
  )
}

export async function deleteQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustBeQuestCreator(r.auth.credentials.id);

  if (quest.status !== QuestStatus.Created && quest.status !== QuestStatus.Closed) {
    return error(Errors.InvalidStatus, "Quest cannot be deleted at current stage", {});
  }

  await quest.destroy({ force: true });

  return output();
}

export async function closeQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustHaveStatus(QuestStatus.Created);
  quest.mustBeQuestCreator(r.auth.credentials.id);

  await quest.update({ status: QuestStatus.Closed });

  return output();
}

export async function startQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  const assignedWorker = await User.findByPk(r.payload.assignedWorkerId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (!assignedWorker) {
    return error(Errors.NotFound, 'Assigned user is not found', {});
  }

  quest.mustBeQuestCreator(r.auth.credentials.id);
  quest.mustHaveStatus(QuestStatus.Created);
  assignedWorker.mustHaveRole(UserRole.Employer);

  const questResponse = await QuestsResponse.findOne({
    where: {
      workerId: assignedWorker.id
    }
  });

  if (!questResponse) {
    return error(Errors.NotFound, "Assigned user did not respond on quest", {});
  }
  // TODO
  if (questResponse.type === QuestsResponseType.Response) {
    questResponse.mustHaveStatus(QuestsResponseStatus.Open);
  } else if (questResponse.type === QuestsResponseType.Invite) {
    questResponse.mustHaveStatus(QuestsResponseStatus.Accepted);
  }

  await quest.update({ assignedWorkerId: assignedWorker.id, status: QuestStatus.WaitWorker });

  return output();
}

export async function rejectWorkOnQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustHaveStatus(QuestStatus.WaitWorker);
  quest.mustBeQuestCreator(r.auth.credentials.id);

  await quest.update({ assignedWorkerId: null, status: QuestStatus.Created });

  return output();
}

export async function acceptWorkOnQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustHaveStatus(QuestStatus.WaitWorker);
  quest.mustBeQuestCreator(r.auth.credentials.id);

  await quest.update({ status: QuestStatus.Active });

  return output();
}

export async function completeWorkOnQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustHaveStatus(QuestStatus.Active);
  quest.mustBeQuestCreator(r.auth.credentials.id);

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

  await quest.update({ status: QuestStatus.Closed });

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
  const where = {
    ...(r.query.priority && { priority: r.query.priority }),
    ...(r.query.status && { status: r.query.status }),
    ...(r.params.userId && { userId: r.params.userId })
  };

  if (r.query.q) {
    where[Op.or] = searchFields.map(field => ({
      [field]: {
        [Op.iLike]: `%${r.query.q}%`
      }
    }))
  }

  for (const [key, value] of Object.entries(r.query.sort)) {
    order.push([key, value]);
  }

  const { count, rows } = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    where, order,
  });

  return output({count, quests: rows});
}
