import { Op } from 'sequelize'
import {error, output} from "../utils";
import {Errors} from "../utils/errors";
import {publishQuestNotifications, QuestNotificationActions} from "../websocket/websocket.quest";
import {QuestsResponseController } from "../controllers/quest/controller.questsResponse";
import {QuestController} from "../controllers/quest/controller.quest";
import {UserController}  from "../controllers/user/controller.user";
import {
  User,
  Quest,
  UserRole,
  QuestStatus,
  QuestsResponse,
  QuestsResponseType,
  QuestsResponseStatus,
} from "@workquest/database-models/lib/models";

export async function responseOnQuest(r) {
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker);

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  await questController.questMustHaveStatus(QuestStatus.Created);
  await workerController.userMustHaveRole(UserRole.Worker);

  let questResponse: QuestsResponse = await QuestsResponse.findOne({
    where: {
      questId: questController.quest.id,
      workerId: worker.id,
      status: {[Op.ne]: QuestsResponseStatus.Accepted}
    }
  });

  if (questResponse) {
    if (questResponse.previousStatus === QuestsResponseStatus.Rejected) {
      return error(Errors.Forbidden, "Client already rejected your response on quest", { questResponse });
    }
    if (questResponse.status === QuestsResponseStatus.Open) {
      return error(Errors.AlreadyAnswer, "You already answered quest", { questResponse });
    }
  }

  questResponse = await QuestsResponse.create({
    workerId: worker.id,
    questId: questController.quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    previousStatus: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
  });

  await publishQuestNotifications(r.server, {
    data: questResponse,
    recipients: [quest.userId],
    action: QuestNotificationActions.workerRespondedToQuest,
  });

  return output();
}

export async function inviteOnQuest(r) {
  const employer: User = r.auth.credentials;
  const employerController = new UserController(employer);

  const invitedWorker = await User.findByPk(r.payload.invitedUserId);
  const invitedWorkerController = new UserController(invitedWorker);

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  await employerController.userMustHaveRole(UserRole.Employer);
  await invitedWorkerController.userMustHaveRole(UserRole.Worker);

  await questController.questMustHaveStatus(QuestStatus.Created);
  await questController.employerMustBeQuestCreator(employer.id);

  let questResponse: QuestsResponse = await QuestsResponse.findOne({
    where: { questId: questController.quest.id, workerId: invitedWorkerController.user.id, status: {[Op.ne]: QuestsResponseStatus.Accepted} }
  });

  if(questResponse) {
    if(questResponse.previousStatus === QuestsResponseStatus.Rejected) {
      return error(Errors.Forbidden, 'Person reject quest invitation', {});
    }

    if (questResponse.status === QuestsResponseStatus.Open) {
      return error(Errors.AlreadyAnswer, "You have already been invited user to the quest", { questResponse });
    }
  }

  questResponse = await QuestsResponse.create({
    workerId: invitedWorkerController.user.id,
    questId: questController.quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    previousStatus: QuestsResponseStatus.Open,
    type: QuestsResponseType.Invite,
  });

  await publishQuestNotifications(r.server, {
    data: questResponse,
    recipients: [invitedWorker.id],
    action: QuestNotificationActions.employerInvitedWorkerToQuest,
  });

  return output();
}

export async function userResponsesToQuest(r) {
  const employer: User = r.auth.credentials;

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  await questController.employerMustBeQuestCreator(employer.id);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { questId: questController.quest.id },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, responses: rows });
}

export async function responsesToQuestsForUser(r) {
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker);

  await workerController.userMustHaveRole(UserRole.Worker);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { workerId: worker.id },
    include: [{
      model: Quest,
      as: 'quest'
    }]
  });

  return output({ count, responses: rows });
}

export async function acceptInviteOnQuest(r) {
  const worker: User = r.auth.credentials;

  let questResponse = await QuestsResponse.findByPk(r.params.responseId, { include: { model: Quest, as: 'quest' } });
  const questsResponseController = new QuestsResponseController(questResponse);

  questsResponseController
    .workerMustBeInvitedToQuest(worker.id)
    .questsResponseMustHaveType(QuestsResponseType.Invite)
    .questsResponseMustHaveStatus(QuestsResponseStatus.Open)

  questResponse = await questResponse.update({ status: QuestsResponseStatus.Accepted, previousStatus: QuestsResponseStatus.Accepted });

  await publishQuestNotifications(r.server, {
    data: questResponse,
    recipients: [questResponse.quest.userId],
    action: QuestNotificationActions.workerAcceptedInvitationToQuest,
  });

  return output();
}

export async function rejectInviteOnQuest(r) {
  const worker: User = r.auth.credentials;

  let questResponse = await QuestsResponse.findByPk(r.params.responseId, { include: { model: Quest, as: 'quest' } });
  const questsResponseController = new QuestsResponseController(questResponse);

  questsResponseController
    .workerMustBeInvitedToQuest(worker.id)
    .questsResponseMustHaveType(QuestsResponseType.Invite)
    .questsResponseMustHaveStatus(QuestsResponseStatus.Open)

  questResponse = await questResponse.update({ status: QuestsResponseStatus.Rejected, previousStatus: QuestsResponseStatus.Rejected });

  await publishQuestNotifications(r.server, {
    data: questResponse,
    recipients: [questResponse.quest.userId],
    action: QuestNotificationActions.workerRejectedInvitationToQuest,
  });

  return output();
}

export async function rejectResponseOnQuest(r) {
  const employer: User = r.auth.credentials;

  let questsResponse = await QuestsResponse.findByPk(r.params.responseId, { include: { model: Quest, as: 'quest' } });
  const questsResponseController = new QuestsResponseController(questsResponse);

  const questController = new QuestController(questsResponse.quest); // TODO проверить

  await questController.employerMustBeQuestCreator(employer.id);

  questsResponseController
    .questsResponseMustHaveType(QuestsResponseType.Response)
    .questsResponseMustHaveStatus(QuestsResponseStatus.Open)

  questsResponse = await questsResponse.update({ status: QuestsResponseStatus.Rejected, previousStatus: QuestsResponseStatus.Rejected });

  await publishQuestNotifications(r.server, {
    data: questsResponse,
    recipients: [questsResponse.quest.userId],
    action: QuestNotificationActions.employerRejectedWorkersResponse,
  });

  return output();
}
