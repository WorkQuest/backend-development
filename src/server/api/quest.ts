import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { Quest, Status } from '../models/Quest';
import { UserRole } from '../models/User';
import { Op } from "sequelize";

export const searchFields = [
  "title",
  "description",
];

export async function createQuest(r) {
  const user = r.auth.credentials;

  if (user.role !== UserRole.Employer) {
    return error(Errors.InvalidRole, "User is not Employer", {});
  }

  const quest = await Quest.create({
    userId: user.id,
    status: Status.Created,
    category: r.payload.category,
    priority: r.payload.priority,
    location: r.payload.location,
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
  });

  return output({...quest.toJSON(), locationPostGIS: undefined});
}

export async function editQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (quest.userId !== r.auth.credentials.id) {
    return error(Errors.Forbidden, "User is not creator of quest", {});
  }

  await quest.update(r.payload);

  return output(quest);
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
