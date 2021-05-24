import { User, UserRole } from '../models/User';
import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { QuestsResponse, QuestsResponseStatus, QuestsResponseType } from '../models/QuestsResponse';
import { Quest, QuestStatus } from '../models/Quest';

export async function questResponse(r) {
  const user = r.auth.credentials;
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (quest.status !== QuestStatus.Created) {
    return error(Errors.InvalidStatus, "Quest isn't at stage created", {});
  }
  if (user.role !== UserRole.Worker) {
    return error(Errors.InvalidRole, "User is not Worker", {});
  }

  const questsResponse = await QuestsResponse.findOne({
    where: {
      questId: quest.id,
      workerId: user.id
    }
  });

  if (questsResponse) {
    return error(Errors.AlreadyAnswer, "You already answered quest", {});
  }

  await QuestsResponse.create({
    workerId: user.id,
    questId: quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
  });

  return output();
}

export async function questInvite(r) {
  const user = r.auth.credentials;
  const invitedWorker = await User.findOne({ where: { id: r.payload.invitedUserId } });
  const quest = await Quest.findByPk(r.params.questId);

  if (user.role !== UserRole.Employer) {
    return error(Errors.InvalidRole, "User is not Employer", {});
  }
  if (invitedWorker.role !== UserRole.Worker) {
    return error(Errors.InvalidRole, "Invited user is not Worker", {});
  }
  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (quest.status !== QuestStatus.Created) {
    return error(Errors.InvalidStatus, "Quest isn't at stage created", {});
  }
  if (quest.userId !== user.id) {
    return error(Errors.Forbidden, "User isn't creator quest", {});
  }

  const questsResponse = await QuestsResponse.findOne({
    where: {
      questId: quest.id,
      workerId: invitedWorker.id
    }
  });

  if (questsResponse) {
    return error(Errors.AlreadyAnswer, "You already answered quest", {});
  }

  await QuestsResponse.create({
    workerId: invitedWorker.id,
    questId: quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Invite,
  });

  return output();
}

export async function getQuestResponses(r) {
  const user = r.auth.credentials;
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (quest.userId !== user.id) {
    return error(Errors.Forbidden, "User isn't creator quest", {});
  }

  const questResponses = await QuestsResponse.findAll({
    where: { questId: quest.id },
    include: [{
      model: User
    }]
  });

  return output(questResponses);
}
