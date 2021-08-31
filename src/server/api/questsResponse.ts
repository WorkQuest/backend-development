import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import {
  User,
  UserRole,
  Quest,
  QuestStatus,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
} from "@workquest/database-models/lib/models";

export async function responseOnQuest(r) {
  const user = r.auth.credentials;
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustHaveStatus(QuestStatus.Created);
  user.mustHaveRole(UserRole.Worker);

  const questsResponse = await QuestsResponse.findOne({
    where: {
      questId: quest.id,
      workerId: user.id
    }
  });

  if (questsResponse && questsResponse.status !== QuestsResponseStatus.Closed) {
    return error(Errors.AlreadyAnswer, "You already answered quest", {});
  }

  const created = await QuestsResponse.create({
    workerId: user.id,
    questId: quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
  });

  if (!created) {
    return error(Errors.InvalidStatus, "Quest don`t created", {});
    }
    await r.server.publish('/notifications/quest', {
      notificationOwnerUserId: user.id,
      status: QuestsResponseStatus.Open,
      message: r.payload.message,
      invitedUserId: quest.userId
    });

  return output();
}

export async function inviteOnQuest(r) {
  const user = r.auth.credentials;
  const invitedWorker = await User.findOne({ where: { id: r.payload.invitedUserId } });
  const quest = await Quest.findByPk(r.params.questId);

  user.mustHaveRole(UserRole.Employer);
  invitedWorker.mustHaveRole(UserRole.Worker);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustHaveStatus(QuestStatus.Created);
  quest.mustBeQuestCreator(user.id);

  const questResponse = await QuestsResponse.findOne({
    where: {
      questId: quest.id,
      workerId: invitedWorker.id
    }
  });

  if (questResponse) {
    return error(Errors.AlreadyAnswer, "You already answered quest", {});
  }

  const createdResponse = await QuestsResponse.create({
    workerId: invitedWorker.id,
    questId: quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Invite,
  });

  if (createdResponse) {
    await r.server.publish('/notifications/quest', {
      notificationOwnerUserId: r.auth.credentials.id,
      invitedUserId: invitedWorker.id,
      message: r.payload.message
    });
  }

  return output();
}

export async function userResponsesToQuest(r) {
  const user = r.auth.credentials;
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  quest.mustBeQuestCreator(user.id);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { questId: quest.id },
  });

  return output({ count, responses: rows });
}

export async function responsesToQuestsForUser(r) {
  const user = r.auth.credentials;

  user.mustHaveRole(UserRole.Worker);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { workerId: user.id },
    include: [{
      model: Quest,
      as: 'quest'
    }]
  });

  return output({ count, responses: rows });
}

export async function acceptInviteOnQuest(r) {
  const user = r.auth.credentials;
  const questsResponse = await QuestsResponse.findOne({ where: { id: r.params.responseId } });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }

  questsResponse.mustBeInvitedToQuest(user.id);
  questsResponse.mustHaveStatus(QuestsResponseStatus.Open);

  await questsResponse.update({ status: QuestsResponseStatus.Accepted });

  if (await questsResponse.status === QuestsResponseStatus.Accepted) {
    const findQuest = await Quest.findOne({where: {id: questsResponse.questId}})
    if (!findQuest){
      return error(Errors.NotFound, "Quest not found", {});
    }
    await r.server.publish('/notifications/quest', {
      notificationOwnerUserId: user.id,
      status: QuestsResponseStatus.Accepted,
      invitedUserId: findQuest.userId
    });
  }

  return output();
}

export async function rejectInviteOnQuest(r) {
  const user = r.auth.credentials;
  const questsResponse = await QuestsResponse.findOne({ where: { id: r.params.responseId } });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }

  questsResponse.mustBeInvitedToQuest(user.id);
  questsResponse.mustHaveStatus(QuestsResponseStatus.Open);

  await questsResponse.update({ status: QuestsResponseStatus.Rejected });

  if (await questsResponse.status === QuestsResponseStatus.Rejected) {
    const findQuest = await Quest.findOne({where: {id: questsResponse.questId}})
    if (!findQuest){
      return error(Errors.NotFound, "Quest not found", {});
    }
    await r.server.publish('/notifications/quest', {
      notificationOwnerUserId: user.id,
      status: QuestsResponseStatus.Rejected,
      invitedUserId: findQuest.userId
    });
  }

  return output();
}
