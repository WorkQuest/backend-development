import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { Quest, QuestStatus } from '../models/Quest';
import { UserRole } from '../models/User';
import { Op } from "sequelize";
import { QuestMedia } from '../models/QuestMedia';
import { Media } from '../models/Media';
import { isMediaExists } from '../utils/storageService';

export const searchFields = [
  "title",
  "description",
];

export async function createQuest(r) {
  const transaction = await r.server.app.db.transaction();
  const user = r.auth.credentials;

  if (user.role !== UserRole.Employer) {
    return error(Errors.InvalidRole, "User is not Employer", {});
  }

  const quest = await Quest.create({
    userId: user.id,
    status: QuestStatus.Created,
    category: r.payload.category,
    priority: r.payload.priority,
    location: r.payload.location,
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
  }, { transaction });

  for (const mediaId of r.payload.medias) {
    const media = await Media.findByPk(mediaId);
    if (!media) {
      transaction.rollBack();

      return error(Errors.NotFound, 'Media is not found', { mediaId: media.id });
    }
    if (!await isMediaExists(media)) {
      transaction.rollBack();

      return error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
    }

    await QuestMedia.create({
      mediaId: mediaId,
      questId: quest.id,
    }, { transaction });
  }

  await transaction.commit();

  return output(
    await Quest.findByPk(quest.id) // TODO: exclude: ['locationPostGIS'] dont exclude
  );
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
    const medias = [];
    for (const mediaId of r.payload.medias) {
      const media = await Media.findByPk(mediaId);
      if (!media) {
        return error(Errors.NotFound, 'Media is not found', { mediaId: media.id });
      }
      if (!await isMediaExists(media)) {
        return error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
      }

      medias.push(media);
    }

    await quest.$set('medias', medias);
  }

  await quest.update(r.payload);

  return output(
    await Quest.findByPk(quest.id) // TODO: exclude: ['locationPostGIS'] dont exclude
  );
}

export async function deleteQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (quest.userId !== r.auth.credentials.id) {
    return error(Errors.Forbidden, "User is not creator of quest", {});
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
