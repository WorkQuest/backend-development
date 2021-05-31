import { User, UserRole } from "../models/User";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { QuestsResponse, QuestsResponseStatus, QuestsResponseType } from "../models/QuestsResponse";
import { Quest, QuestStatus } from "../models/Quest";

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

  const questResponse = await QuestsResponse.findOne({
    where: {
      questId: quest.id,
      workerId: invitedWorker.id
    }
  });

  if (questResponse) {
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

export async function getResponsesToQuest(r) {
  const user = r.auth.credentials;
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }
  if (quest.userId !== user.id) {
    return error(Errors.Forbidden, "User isn't creator quest", {});
  }

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { questId: quest.id },
    include: [{
      model: User
    }]
  });

  return output({ count, responses: rows });
}

export async function getResponsesUserToQuest(r) {
  const user = r.auth.credentials;

  if (user.role !== UserRole.Worker) {
    return error(Errors.InvalidRole, "User is not Worker", {});
  }

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { workerId: user.id },
    include: [{
      model: Quest,
      include: [{ model: User }]
    }]
  });

  return output({ count, responses: rows });
}

export async function acceptInvite(r) {
  const user = r.auth.credentials;
  const questsResponse = await QuestsResponse.findOne({ where: { id: r.params.responseId } });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }
  if (questsResponse.workerId !== user.id) {
    return error(Errors.Forbidden, "User isn't invitation to quest", {});
  }
  if (questsResponse.status !== QuestsResponseStatus.Open) {
    return error(Errors.Forbidden, "Status of response on quest isn't open", {});
  }
  if (questsResponse.type !== QuestsResponseType.Invite) {
    return error(Errors.Forbidden, "Response on quest isn't invite", {});
  }

  await questsResponse.update({ status: QuestsResponseStatus.Accept });

  return output();
}

export async function rejectInvite(r) {
  const user = r.auth.credentials;
  const questsResponse = await QuestsResponse.findOne({ where: { id: r.params.responseId } });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }
  if (questsResponse.workerId !== user.id) {
    return error(Errors.Forbidden, "User isn't invitation to quest", {});
  }
  if (questsResponse.status !== QuestsResponseStatus.Open) {
    return error(Errors.Forbidden, "Status of response on quest isn't open", {});
  }
  if (questsResponse.type !== QuestsResponseType.Invite) {
    return error(Errors.Forbidden, "Response on quest isn't invite", {});
  }

  await questsResponse.update({ status: QuestsResponseStatus.Reject });

  return output();
}
