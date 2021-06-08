import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { Quest, QuestStatus } from '../models/Quest';
import { UserRole } from '../models/User';
import { Op } from 'sequelize';
import { QuestMedia } from '../models/QuestMedia';
import { Media } from '../models/Media';
import { isMediaExists } from '../utils/storageService';
import { transformToGeoPostGIS } from '../utils/quest';

export const searchFields = [
  "title",
  "description",
];

async function getValidMedia(mediaId: string): Promise<Media> {
  const media = await Media.findByPk(mediaId);
  if (!media) {
    throw error(Errors.NotFound, 'Media is not found', { mediaId })
  }
  if (!await isMediaExists(media)) {
    throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
  }

  return media;
}

async function getValidMedias(mediaIds: string[]) {
  const medias = [];
  for (const id of mediaIds) {
    medias.push(await getValidMedia(id));
  }

  return medias;
}

export async function createQuest(r) {
  const user = r.auth.credentials;
  let medias;

  try {
    medias = await getValidMedias(r.payload.medias);
  } catch (err) {
    return err;
  }

  if (user.role !== UserRole.Employer) {
    return error(Errors.InvalidRole, "User is not Employer", {});
  }

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

  for (const media of medias) {
    await QuestMedia.create({
      mediaId: media.id,
      questId: quest.id,
    });
  }

  return output(
    await Quest.findByPk(quest.id)
  )
}

export async function editQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (quest.userId !== r.auth.credentials.id) {
    return error(Errors.Forbidden, "User is not creator of quest", {});
  }
  if (r.payload.medias) {
    let medias;

    try {
      medias = await getValidMedias(r.payload.medias);
    } catch (err) {
      return err;
    }

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
  if (quest.userId !== r.auth.credentials.id) {
    return error(Errors.Forbidden, "User is not creator of quest", {});
  }
  if (quest.status !== QuestStatus.Created) {
    return error(Errors.InvalidStatus, "Quest is not status created", {});
  }

  await quest.destroy({ force: true });

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

  for (const [key, value] of Object.entries(r.query.sort)){
    order.push([key, value]);
  }

  const { count, rows } = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    where, order,
  });

  return output({count, quests: rows});
}
