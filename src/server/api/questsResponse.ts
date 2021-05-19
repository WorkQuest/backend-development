import { UserRole } from '../models/User';
import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { QuestsResponse } from '../models/QuestsResponse';
import { Quest } from '../models/Quest';

export async function questResponse(r) {
  const user = r.auth.credentials;
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (user.role !== UserRole.Worker) {
    return error(Errors.InvalidRole, "User is not Worker", {});
  }

  await QuestsResponse.create({
    userId: user.id,
    questId: quest.id,
    message: r.payload.message,
  });

  return output();
}
