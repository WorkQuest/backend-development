import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { QuestController } from "../controllers/controller.quest";
import { UserController } from "../controllers/controller.user";
import {
  User,
  UserRole,
  Quest,
  QuestStatus,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
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
import { ChatNotificationActions, publishChatNotifications } from "../websocket/websocket.chat";

export async function responseOnQuest(r) {
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker.id, worker);
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await questController.questMustHaveStatus(QuestStatus.Created);
  await workerController.userMustHaveRole(UserRole.Worker);

  const questsResponse = await QuestsResponse.findOne({
    where: {
      questId: quest.id,
      workerId: worker.id,
    }
  });

  if (questsResponse) {
    return error(Errors.AlreadyAnswer, "You already answered quest", { questsResponse });
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
    userId: quest.userId,
    messageAction: MessageAction.workerResponseOnQuest,
  });
  const responseWorkerMessage = Message.build({
    senderUserId: worker.id,
    chatId: chat.id,
    text: r.payload.message,
    type: MessageType.message,
    number: 2, /** Because create */
    createdAt: Date.now() + 100,
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

  await publishChatNotifications(r.server, {
    action: ChatNotificationActions.newMessage,
    recipients: [quest.userId],
    data: await Message.findByPk(firstInfoMessage.id),
  });

  return output(chat);
}

export async function inviteOnQuest(r) {
  const employer: User = r.auth.credentials;
  const invitedWorkerController = new UserController(r.payload.invitedUserId);
  const employerController = new UserController(employer.id, employer);
  const invitedWorker = await invitedWorkerController.findModel();
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await employerController.userMustHaveRole(UserRole.Employer);
  await invitedWorkerController.userMustHaveRole(UserRole.Worker);

  await questController.questMustHaveStatus(QuestStatus.Created);
  await questController.employerMustBeQuestCreator(employer.id);

  const questResponse = await QuestsResponse.findOne({
    where: { questId: quest.id, workerId: invitedWorker.id }
  });

  if (questResponse) {
    return error(Errors.AlreadyAnswer, "You already answered quest", { questResponse });
  }

  const transaction = await r.server.app.db.transaction();

  const response = QuestsResponse.build({
    workerId: invitedWorker.id,
    questId: quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
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
    createdAt: Date.now() + 100,
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

  await publishChatNotifications(r.server, {
    action: ChatNotificationActions.newMessage,
    recipients: [quest.userId],
    data: await Message.findByPk(firstInfoMessage.id),
  });

  return output({ chat });
}

export async function userResponsesToQuest(r) {
  const employer: User = r.auth.credentials;
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await questController.employerMustBeQuestCreator(employer.id);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { questId: quest.id },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, responses: rows });
}

export async function responsesToQuestsForUser(r) {
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker.id, worker);

  await workerController.userMustHaveRole(UserRole.Worker);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { workerId: worker.id },
    include: { model: Quest, as: 'quest' },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, responses: rows });
}

export async function acceptInviteOnQuest(r) {
  const worker: User = r.auth.credentials;
  const questsResponse = await QuestsResponse.findOne({
    where: { id: r.params.responseId },
    include: { model: Quest, as: 'quest' },
  });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }

  questsResponse.mustBeInvitedToQuest(worker.id);
  questsResponse.mustHaveType(QuestsResponseType.Invite);
  questsResponse.mustHaveStatus(QuestsResponseStatus.Open);

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

  await Promise.all([
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    questsResponse.update({ status: QuestsResponseStatus.Accepted }, { transaction }),
  ]);

  await transaction.commit();

  return output();
}

export async function rejectInviteOnQuest(r) {
  const worker: User = r.auth.credentials;
  const questsResponse = await QuestsResponse.findOne({
    where: { id: r.params.responseId },
    include: { model: Quest, as: 'quest' },
  });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }

  questsResponse.mustBeInvitedToQuest(worker.id);
  questsResponse.mustHaveType(QuestsResponseType.Invite);
  questsResponse.mustHaveStatus(QuestsResponseStatus.Open);

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

  await Promise.all([
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    questChat.update({ status: QuestChatStatuses.Close }, { transaction }),
    questsResponse.update({ status: QuestsResponseStatus.Rejected }, { transaction }),
  ]);

  await transaction.commit();

  return output();
}

export async function rejectResponseOnQuest(r) {
  const employer: User = r.auth.credentials;
  const questsResponse = await QuestsResponse.findOne({ where: { id: r.params.responseId } });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }

  const questController = new QuestController(questsResponse.questId);

  await questController.findModel();

  await questController.employerMustBeQuestCreator(employer.id);
  questsResponse.mustHaveType(QuestsResponseType.Response);
  questsResponse.mustHaveStatus(QuestsResponseStatus.Open);

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

  await Promise.all([
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    questsResponse.update({ status: QuestsResponseStatus.Rejected }, { transaction }),
    QuestChat.update({ status: QuestChatStatuses.Close }, { where: { responseId: questsResponse.id }, transaction }),
  ]);

  await transaction.commit();

  return output();
}
