import { output } from '../utils';
import { MediaController } from '../controllers/controller.media';
import { QuestChatController } from '../controllers/chat/controller.questChat';
import { ChatNotificationActions, QuestNotificationActions } from '../controllers/controller.broker';
import { QuestResponseController, QuestsInviteController } from '../controllers/quest/controller.questResponses';
import { ChecksListQuest } from '../checks-list/checksList.quest';
import { ChecksListUser } from '../checks-list/checksList.user';
import { ChecksListQuestInvite, ChecksListQuestResponse } from '../checks-list/checksList.questResponse';
import { QuestControllerFactory } from '../factories/factory.questController';
import { QuestChatControllerFactory } from '../factories/factory.chatController';
import { EmployerControllerFactory, WorkerControllerFactory } from '../factories/factory.userController';
import {
  QuestInviteControllerFactory,
  QuestResponseControllerFactory,
} from '../factories/factory.questsResponsesController';
import {
  User,
  Quest,
  UserRole,
  QuestChat,
  QuestStatus,
  QuestsResponse,
  QuestsResponseType,
  QuestsResponseStatus,
} from '@workquest/database-models/lib/models';

export async function responseOnQuest(r) {
  const { message, medias } = r.payload;

  const mediaModels = await MediaController.getMedias(medias);

  const workerController = WorkerControllerFactory.createByUserModel(r.auth.credentials);
  const questController = await QuestControllerFactory.createById(r.params.questId);

  const checksListQuest = new ChecksListQuest(questController.quest);
  const checksListWorker = new ChecksListUser(workerController.user);

  await checksListWorker
    .checkUserRole(UserRole.Worker)
    //.checkWorkerRatingMustMatchEmployerVisibilitySettings(questController.quest.user)
  checksListQuest
    .checkQuestStatuses(QuestStatus.Recruitment)

  const [questResponseController, questChatController] = await r.server.app.db.transaction(async (tx) => {
    const questResponseController = await QuestResponseController.sendRequest({
      message,
      quest: questController.quest,
      worker: workerController.user,
    }, { tx });

    await questResponseController.setMedias(mediaModels, { tx })

    const questChatController = await QuestChatController.create({
      message,
      quest: questController.quest,
      worker: workerController.user,
      questResponse: questResponseController.questResponse,
    }, { tx });

    return [questResponseController, questChatController];
  }) as [QuestResponseController, QuestChatController];

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: [questController.quest.userId],
    data: await questChatController.firstMessage(),
  });

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.workerRespondedToQuest,
    recipients: [questController.quest.userId],
    data: questResponseController.toDto(),
  });

  return(
    questChatController.toDto()
  );
}

export async function inviteOnQuest(r) {
  const { invitedUserId, message } = r.payload;

  const workerController = await WorkerControllerFactory.createById(invitedUserId);
  const employerController = await EmployerControllerFactory.createByUserModel(r.auth.credentials);
  const questController = await QuestControllerFactory.createById(r.params.questId);

  const checksListQuest = new ChecksListQuest(questController.quest);
  const checksListWorker = new ChecksListUser(workerController.user);
  const checksListEmployer = new ChecksListUser(employerController.user);

  await checksListEmployer
    .checkUserRole(UserRole.Employer)
    //.checkEmployerRatingMustMatchWorkerVisibilitySettings(workerController.user)
  checksListWorker
    .checkUserRole(UserRole.Worker)
  checksListQuest
    .checkOwner(employerController.user)
    .checkQuestStatuses(QuestStatus.Recruitment)

  const [inviteController, questChatController] = await r.server.app.db.transaction(async (tx) => {
    const inviteController = await QuestsInviteController.sendInvite({
      message,
      quest: questController.quest,
      worker: workerController.user,
    }, { tx });

    const questChatController = await QuestChatController.create({
      message,
      quest: questController.quest,
      worker: workerController.user,
      questResponse: inviteController.questInvite,
    }, { tx });

    return [inviteController, questChatController];
  }) as [QuestsInviteController, QuestChatController];

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: [employerController.user.id],
    data: await questChatController.firstMessage(),
  });

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.employerInvitedWorkerToQuest,
    recipients: [workerController.user.id],
    data: inviteController.toDto(),
  });

  return output(
    questChatController.toDto()
  );
}

export async function getResponsesToQuest(r) {
  const { questId } = r.params;

  const employerController = EmployerControllerFactory.createByUserModel(r.auth.credentials);
  const questController = await QuestControllerFactory.createById(questId);

  const checksListQuest = new ChecksListQuest(questController.quest);
  const checksListEmployer = new ChecksListUser(employerController.user);

  checksListEmployer
    .checkUserRole(UserRole.Employer)
  checksListQuest
    .checkOwner(employerController.user);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    include: [
      {
        model: QuestChat.unscoped(),
        attributes: ['chatId'],
        as: 'questChat',
      },
      {
        model: User.scope('shortWithWallet'),
        as: 'worker',
      },
    ],
    where: { questId: questController.quest.id },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, responses: rows });
}

export async function responsesToQuestsForUser(r) {
  const workerController = WorkerControllerFactory.createByUserModel(r.auth.credentials);

  const checksListWorker = new ChecksListUser(workerController.user);

  checksListWorker
    .checkUserRole(UserRole.Worker)

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { workerId: workerController.user.id },
    include: [
      {
        model: Quest,
        as: 'quest',
      },
      {
        model: QuestChat.unscoped(),
        attributes: ['chatId'],
        as: 'questChat',
      },
    ],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, responses: rows });
}

export async function acceptInviteOnQuest(r) {
  const { responseId } = r.params;

  const questInviteController = await QuestInviteControllerFactory.createById(responseId);
  const workerController = WorkerControllerFactory.createByUserModel(r.auth.credentials);
  const questChatController = await QuestChatControllerFactory.createByQuestResponseId(responseId);

  const checksListQuestInvite = new ChecksListQuestInvite(questInviteController.questInvite);

  checksListQuestInvite
    .checkWorkerMustBeInvitedToQuest(workerController.user)
    .checkQuestsResponseMustHaveType(QuestsResponseType.Invite)
    .checkStatuses(QuestsResponseStatus.Open)

  await r.server.app.db.transaction(async (tx) => {
    await questInviteController.acceptInvitation({ tx });
    await questChatController.sendInfoMessageAboutAcceptInvite({ tx });
  });

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.workerAcceptedInvitationToQuest,
    recipients: [questInviteController.quest.userId],
    data: questInviteController.toDto(),
  });

  return output();
}

export async function rejectInviteOnQuest(r) {
  const { responseId } = r.params;

  const questInviteController = await QuestInviteControllerFactory.createById(responseId);
  const workerController = WorkerControllerFactory.createByUserModel(r.auth.credentials);
  const questChatController = await QuestChatControllerFactory.createByQuestResponseId(responseId);

  const checksListQuestInvite = new ChecksListQuestInvite(questInviteController.questInvite);

  checksListQuestInvite
    .checkWorkerMustBeInvitedToQuest(workerController.user)
    .checkQuestsResponseMustHaveType(QuestsResponseType.Invite)
    .checkStatuses(QuestsResponseStatus.Open)

  await r.server.app.db.transaction(async (tx) => {
    await questInviteController.rejectInvitation({ tx });
    await questChatController.sendInfoMessageAboutRejectInvite({ tx });
    await questChatController.closeQuestChat({ tx });
  });

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.workerRejectedInvitationToQuest,
    recipients: [questInviteController.quest.userId],
    data: questInviteController.toDto(),
  });

  return output();
}

export async function rejectResponseOnQuest(r) {
  const { responseId } = r.params;

  const questResponseController = await QuestResponseControllerFactory.createById(responseId);
  const employerController = EmployerControllerFactory.createByUserModel(r.auth.credentials);
  const questChatController = await QuestChatControllerFactory.createByQuestResponseId(responseId);

  const checksListQuest = new ChecksListQuest(questResponseController.quest);
  const checksListQuestResponse = new ChecksListQuestResponse(questResponseController.questResponse);

  checksListQuest
    .checkOwner(employerController.user)
    .checkQuestStatuses(QuestStatus.Recruitment)
  checksListQuestResponse
    .checkQuestsResponseMustHaveType(QuestsResponseType.Response)
    .checkStatuses(QuestsResponseStatus.Open)


  await r.server.app.db.transaction(async (tx) => {
    await questResponseController.rejectRequest({ tx });
    await questChatController.sendInfoMessageAboutRejectResponse({ tx });
    await questChatController.closeQuestChat({ tx });
  });

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.employerRejectedWorkersResponse,
    recipients: [questResponseController.questResponse.workerId],
    data: questResponseController.toDto(),
  });

  return output();
}
