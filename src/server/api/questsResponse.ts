import { Op } from 'sequelize'
import {error, output} from "../utils";
import {Errors} from "../utils/errors";
import {publishQuestNotifications, QuestNotificationActions} from "../websocket/websocket.quest";
import {QuestsResponseController } from "../controllers/quest/controller.questsResponse";
import {QuestController} from "../controllers/quest/controller.quest";
import {UserController}  from "../controllers/user/controller.user";
import {
  User,
  UserRole,
  Quest,
  UserRole,
  QuestStatus,
  QuestsResponse,
  QuestsResponseType,
  QuestsResponseStatus,
  QuestChat,
  Chat,
  ChatType,
  Message,
  MessageType,
  ChatMember,
  InfoMessage,
  MessageAction,
  QuestChatStatuses,
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
      status: { [Op.ne]: QuestsResponseStatus.Accepted }
    }
  });

  // TODO вынести в контроллер
  if (questResponse) {
    if (questResponse.previousStatus === QuestsResponseStatus.Rejected) {
      return error(Errors.Forbidden, "Client already rejected your response on quest", { questResponse });
    }
    if (questResponse.status === QuestsResponseStatus.Open) {
      return error(Errors.AlreadyAnswer, "You already answered quest", { questResponse });
    }
  }

  const transaction = await r.server.app.db.transaction();

  const response = QuestsResponse.build({
    workerId: worker.id,
    questId: quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
  });

  // TODO вынести в контроллер
  const chat = Chat.build({
    type: ChatType.quest,
  });

  const firstInfoMessage = Message.build({
    senderUserId: worker.id,
    chatId: chat.id,
    type: MessageType.info,
    number: 1, /** Because create */
    createdAt: Date.now(),
  });
  const infoMessage = InfoMessage.build({
    messageId: firstInfoMessage.id,
    userId: null,
    messageAction: MessageAction.workerResponseOnQuest,
  });
  const responseWorkerMessage = Message.build({
    senderUserId: worker.id,
    chatId: chat.id,
    text: r.payload.message,
    type: MessageType.message,
    number: 2, /** Because create */
    createdAt: Date.now(),
  });

  const questChat = QuestChat.build({
    employerId: quest.userId ,
    workerId: worker.id,
    questId: quest.id,
    responseId: response.id,
    chatId: chat.id,
  });
  const members = ChatMember.bulkBuild([{
    unreadCountMessages: 0, /** Because created */
    chatId: chat.id,
    userId: r.auth.credentials.id,
    lastReadMessageId: firstInfoMessage.id, /** Because created,  */
    lastReadMessageNumber: firstInfoMessage.number,
  }, {
    unreadCountMessages: 1, /** Because created */
    chatId: chat.id,
    userId: quest.userId,
    lastReadMessageId: null, /** Because created */
    lastReadMessageNumber: null,
  }]);

  chat.lastMessageId = responseWorkerMessage.id;
  chat.lastMessageDate = responseWorkerMessage.createdAt;

  await Promise.all([
    response.save({ transaction }),
    chat.save({ transaction }),
    firstInfoMessage.save({ transaction }),
    infoMessage.save({ transaction }),
    responseWorkerMessage.save({ transaction }),
    members.map(member => member.save({ transaction })),
    questChat.save({ transaction }),
  ]);

  await transaction.commit();

  await publishQuestNotifications(r.server, {
    data: questResponse,
    recipients: [quest.userId],
    action: QuestNotificationActions.workerRespondedToQuest,
  });

  return output(chat);
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

  if (questResponse) {
    if(questResponse.previousStatus === QuestsResponseStatus.Rejected) {
      return error(Errors.Forbidden, 'Person reject quest invitation', {});
    }

    if (questResponse.status === QuestsResponseStatus.Open) {
      return error(Errors.AlreadyAnswer, "You have already been invited user to the quest", { questResponse });
    }
  }

  const transaction = await r.server.app.db.transaction();

  questResponse = QuestsResponse.build({
    workerId: invitedWorkerController.user.id,
    questId: questController.quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    previousStatus: QuestsResponseStatus.Open,
    type: QuestsResponseType.Invite,
  });

  const chat = Chat.build({ type: ChatType.quest });

  const firstInfoMessage = Message.build({
    senderUserId: employer.id,
    chatId: chat.id,
    type: MessageType.info,
    number: 1, /** Because create */
    createdAt: Date.now(),
  });
  const infoMessage = InfoMessage.build({
    messageId: firstInfoMessage.id,
    userId: invitedWorker.id,
    messageAction: MessageAction.employerInviteOnQuest,
  });
  const inviteEmployerMessage = Message.build({
    senderUserId: employer.id,
    chatId: chat.id,
    text: r.payload.message,
    type: MessageType.message,
    number: 2, /** Because create */
    createdAt: Date.now(),
  });

  const members = ChatMember.bulkBuild([{
    unreadCountMessages: 0, /** Because created */
    chatId: chat.id,
    userId: r.auth.credentials.id,
    lastReadMessageId: firstInfoMessage.id, /** Because created,  */
    lastReadMessageNumber: 1
  }, {
    unreadCountMessages: 1, /** Because created */
    chatId: chat.id,
    userId: invitedWorker.id,
    lastReadMessageId: null, /** Because created */
    lastReadMessageNumber: null,
  }]);
  const questChat = QuestChat.build({
    employerId: quest.userId ,
    workerId: invitedWorker.id,
    questId: quest.id,
    responseId: response.id,
    chatId: chat.id,
  });

  chat.lastMessageId = inviteEmployerMessage.id;
  chat.lastMessageDate = inviteEmployerMessage.createdAt;


  await Promise.all([
    response.save({ transaction }),
    chat.save({ transaction }),
    firstInfoMessage.save({ transaction }),
    infoMessage.save({ transaction }),
    inviteEmployerMessage.save({ transaction }),
    members.map( member => member.save({ transaction }) ),
    questChat.save({ transaction }),
  ]);

  await transaction.commit();

  await publishQuestNotifications(r.server, {
    data: questResponse,
    recipients: [invitedWorker.id],
    action: QuestNotificationActions.employerInvitedWorkerToQuest,
  });

  return output({ chat });
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

  let questResponse = await QuestsResponse.findOne({
    where: { id: r.params.responseId },
    include: { model: Quest, as: 'quest' },
  });
  const questsResponseController = new QuestsResponseController(questResponse);

  questsResponseController
    .workerMustBeInvitedToQuest(worker.id)
    .questsResponseMustHaveType(QuestsResponseType.Invite)
    .questsResponseMustHaveStatus(QuestsResponseStatus.Open)

  const transaction = await r.server.app.db.transaction();

  const questChat = await QuestChat.findOne({
    where: { responseId: questsResponse.id },
    include: {
      model: Chat.unscoped(), as: 'chat',
      include: [{
        model: Message.unscoped(),
        as: 'lastMessage'
      }]
    },
  });
  const message = Message.build({
    senderUserId: worker.id,
    chatId: questChat.chatId,
    type: MessageType.info,
    number: questChat.chat.lastMessage.number + 1,
    createdAt: Date.now(),
  });
  const infoMessage = InfoMessage.build({
    messageId: message.id,
    userId: questsResponse.quest.userId,
    messageAction: MessageAction.workerAcceptInviteOnQuest,
  });

  const [,, questsResponse] = await Promise.all([
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    questsResponse.update({ status: QuestsResponseStatus.Accepted }, { transaction }),
  ]);

  await transaction.commit();

  await publishQuestNotifications(r.server, {
    data: questResponse,
    recipients: [questResponse.quest.userId],
    action: QuestNotificationActions.workerAcceptedInvitationToQuest,
  });

  return output();
}

export async function rejectInviteOnQuest(r) {
  const worker: User = r.auth.credentials;

  let questResponse = await QuestsResponse.findOne({
    where: { id: r.params.responseId },
    include: { model: Quest, as: 'quest' },
  });
  const questsResponseController = new QuestsResponseController(questResponse);

  questsResponseController
    .workerMustBeInvitedToQuest(worker.id)
    .questsResponseMustHaveType(QuestsResponseType.Invite)
    .questsResponseMustHaveStatus(QuestsResponseStatus.Open)

  const transaction = await r.server.app.db.transaction();

  //TODO In chat controller
  const questChat = await QuestChat.findOne({
    where: { responseId: questsResponse.id },
    include: {
      model: Chat.unscoped(), as: 'chat',
      include: [{
        model: Message.unscoped(),
        as: 'lastMessage'
      }]
    },
  });
  const message = Message.build({
    senderUserId: worker.id,
    chatId: questChat.chatId,
    type: MessageType.info,
    number: questChat.chat.lastMessage.number + 1,
    createdAt: Date.now(),
  });
  const infoMessage = InfoMessage.build({
    messageId: message.id,
    userId: questsResponse.quest.userId,
    messageAction: MessageAction.workerRejectInviteOnQuest,
  });

  const [,, questsResponse] = await Promise.all([
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    questChat.update({ status: QuestChatStatuses.Close }, { transaction }),
    questsResponse.update({ status: QuestsResponseStatus.Rejected }, { transaction }),
  ]);

  await transaction.commit();

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

  const transaction = await r.server.app.db.transaction();

  questsResponse = await QuestChat.findOne({
    where: { responseId: questsResponse.id },
    include: {
      model: Chat.unscoped(), as: 'chat',
      include: [{
        model: Message.unscoped(),
        as: 'lastMessage'
      }]
    },
  });
  const message = Message.build({
    senderUserId: employer.id,
    chatId: questChat.chatId,
    type: MessageType.info,
    number: questChat.chat.lastMessage.number + 1,
    createdAt: Date.now(),
  });
  const infoMessage = InfoMessage.build({
    messageId: message.id,
    userId: questsResponse.workerId,
    messageAction: MessageAction.employerRejectResponseOnQuest,
  });

  const [,, questsResponse] = await Promise.all([
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    questsResponse.update({ status: QuestsResponseStatus.Rejected }, { transaction }),
    QuestChat.update({ status: QuestChatStatuses.Close }, { where: { responseId: questsResponse.id }, transaction }),
  ]);

  await transaction.commit();

  await publishQuestNotifications(r.server, {
    data: questsResponse,
    recipients: [questsResponse.quest.userId],
    action: QuestNotificationActions.employerRejectedWorkersResponse,
  });

  return output();
}
