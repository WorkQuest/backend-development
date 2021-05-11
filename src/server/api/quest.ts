import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { Priority, Quest } from '../models/Quest';
import { User, UserRole } from '../models/User';

export async function createQuest(r) {
  const user = r.auth.credentials;

  if (user.role !== UserRole.Employer) {
    return error(Errors.InvalidPayload, "User is not Employer", {});
  }

  const quest = await Quest.create({
    userId: user.id,
    category: r.payload.category,
    priority: r.payload.priority,
    location: r.payload.location,
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
  });

  return output(quest);
}

export async function deleteQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (quest.userId !== r.auth.credentials.id) {
    return error(Errors.UnconfirmedUser, "User is not creator of quest", {});
  }

  await quest.destroy({ force: true });

  return output();
}
