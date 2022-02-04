import { Op } from 'sequelize';
import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { ChatNotificationActions, QuestNotificationActions } from '../controllers/controller.broker';
import { QuestsResponseController } from '../controllers/quest/controller.questsResponse';
import { QuestController } from '../controllers/quest/controller.quest';
import { UserController } from '../controllers/user/controller.user';
import { MediaController } from '../controllers/controller.media';
import {
  Chat,
  ChatMember,
  ChatType,
  InfoMessage,
  Message,
  MessageAction,
  MessageType,
  Quest,
  QuestChat,
  QuestChatStatuses,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
  QuestStatus,
  User,
  UserRole,
} from '@workquest/database-models/lib/models';

export async function responseOnQuest(r) {
  let questResponse: QuestsResponse;
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker);

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  await questController.questMustHaveStatus(QuestStatus.Created);
  await workerController.userMustHaveRole(UserRole.Worker);

  questResponse = await QuestsResponse.findOne({
    where: {
      workerId: worker.id,
      questId: questController.quest.id,
      status: { [Op.ne]: QuestsResponseStatus.Accepted },
    },
  });

  if (questResponse) {
    return error(Errors.AlreadyAnswer, 'You already answered quest', { questResponse });

    // if (questResponse.previousStatus === QuestsResponseStatus.Rejected) {
    //   return error(Errors.Forbidden, "Client already rejected your response on quest", { questResponse });
    // }
    // if (questResponse.status === QuestsResponseStatus.Open) {
    //   return error(Errors.AlreadyAnswer, "You already answered quest", { questResponse });
    // }
  }

  const transaction = await r.server.app.db.transaction();

  const medias = await MediaController.getMedias(r.payload.medias);

  questResponse = await QuestsResponse.create(
    {
      workerId: worker.id,
      questId: quest.id,
      message: r.payload.message,
      status: QuestsResponseStatus.Open,
      type: QuestsResponseType.Response,
    },
    { transaction },
  );

  const questResponseController = new QuestsResponseController(questResponse);

  await questResponseController.setMedias(medias, transaction);

  // TODO вынести в контроллер создание квест-чата
  const chat = Chat.build({ type: ChatType.quest });
  const firstInfoMessage = Message.build({
    senderUserId: worker.id,
    chatId: chat.id,
    type: MessageType.info,
    number: 1 /** Because create */,
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
    number: 2 /** Because create */,
    createdAt: Date.now() + 100,
  });
  const questChat = QuestChat.build({
    employerId: quest.userId,
    workerId: worker.id,
    questId: quest.id,
    responseId: questResponse.id,
    chatId: chat.id,
  });
  const members = ChatMember.bulkBuild([
    {
      unreadCountMessages: 0 /** Because created */,
      chatId: chat.id,
      userId: r.auth.credentials.id,
      lastReadMessageId: firstInfoMessage.id /** Because created,  */,
      lastReadMessageNumber: firstInfoMessage.number,
    },
    {
      unreadCountMessages: 1 /** Because created */,
      chatId: chat.id,
      userId: quest.userId,
      lastReadMessageId: null /** Because created */,
      lastReadMessageNumber: null,
    },
  ]);

  chat.lastMessageId = responseWorkerMessage.id;
  chat.lastMessageDate = responseWorkerMessage.createdAt;

  await Promise.all([
    chat.save({ transaction }),
    firstInfoMessage.save({ transaction }),
    infoMessage.save({ transaction }),
    responseWorkerMessage.save({ transaction }),
    questChat.save({ transaction }),
    ...members.map((member) => member.save({ transaction })),
  ] as Promise<any>[]);

  await responseWorkerMessage.$set('medias', medias, { transaction });

  await transaction.commit();

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: [quest.userId],
    data: await Message.findByPk(firstInfoMessage.id),
  });

  questResponse.setDataValue('quest', quest);
  questResponse.setDataValue('worker', workerController.shortCredentials);
  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.workerRespondedToQuest,
    recipients: [quest.userId],
    data: questResponse,
  });

  return output(chat);
}

export async function inviteOnQuest(r) {
  let questResponse: QuestsResponse;
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

  questResponse = await QuestsResponse.findOne({
    where: {
      questId: questController.quest.id,
      workerId: invitedWorkerController.user.id,
      status: { [Op.ne]: QuestsResponseStatus.Accepted },
    },
  });

  if (questResponse) {
    return error(Errors.AlreadyAnswer, 'You have already been invited user to the quest', { questResponse });
    // if(questResponse.previousStatus === QuestsResponseStatus.Rejected) {
    //   return error(Errors.Forbidden, 'Person reject quest invitation', {});
    // }
    // if (questResponse.status === QuestsResponseStatus.Open) {
    //   return error(Errors.AlreadyAnswer, "You have already been invited user to the quest", { questResponse });
    // }
  }

  const transaction = await r.server.app.db.transaction();

  questResponse = await QuestsResponse.create(
    {
      workerId: invitedWorkerController.user.id,
      questId: questController.quest.id,
      message: r.payload.message,
      status: QuestsResponseStatus.Open,
      previousStatus: QuestsResponseStatus.Open,
      type: QuestsResponseType.Invite,
    },
    { transaction },
  );

  const chat = Chat.build({ type: ChatType.quest });
  const firstInfoMessage = Message.build({
    senderUserId: employer.id,
    chatId: chat.id,
    type: MessageType.info,
    number: 1 /** Because create */,
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
    number: 2 /** Because create */,
    createdAt: Date.now() + 100,
  });
  const members = ChatMember.bulkBuild([
    {
      unreadCountMessages: 0 /** Because created */,
      chatId: chat.id,
      userId: r.auth.credentials.id,
      lastReadMessageId: firstInfoMessage.id /** Because created,  */,
      lastReadMessageNumber: 1,
    },
    {
      unreadCountMessages: 1 /** Because created */,
      chatId: chat.id,
      userId: invitedWorker.id,
      lastReadMessageId: null /** Because created */,
      lastReadMessageNumber: null,
    },
  ]);
  const questChat = QuestChat.build({
    employerId: quest.userId,
    workerId: invitedWorker.id,
    questId: quest.id,
    responseId: questResponse.id,
    chatId: chat.id,
  });

  chat.lastMessageId = inviteEmployerMessage.id;
  chat.lastMessageDate = inviteEmployerMessage.createdAt;

  await Promise.all([
    chat.save({ transaction }),
    firstInfoMessage.save({ transaction }),
    infoMessage.save({ transaction }),
    inviteEmployerMessage.save({ transaction }),
    questChat.save({ transaction }),
    ...members.map((member) => member.save({ transaction })),
  ] as Promise<any>[]);

  await transaction.commit();

  questResponse.setDataValue('quest', questController.quest);
  questResponse.setDataValue('employer', employerController.shortCredentials);

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: [quest.userId],
    data: await Message.findByPk(firstInfoMessage.id),
  });

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.employerInvitedWorkerToQuest,
    recipients: [invitedWorker.id],
    data: questResponse,
  });

  return output({ chat });
}

export async function userResponsesToQuest(r) {
  const employer: User = r.auth.credentials;

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  await questController.employerMustBeQuestCreator(employer.id);

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
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker);

  await workerController.userMustHaveRole(UserRole.Worker);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { workerId: worker.id },
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
  let questResponse: QuestsResponse;
  const worker: User = r.auth.credentials;

  questResponse = await QuestsResponse.findOne({
    where: { id: r.params.responseId },
    include: { model: Quest, as: 'quest' },
  });
  const questsResponseController = new QuestsResponseController(questResponse);

  questsResponseController
    .workerMustBeInvitedToQuest(worker.id)
    .questsResponseMustHaveType(QuestsResponseType.Invite)
    .questsResponseMustHaveStatus(QuestsResponseStatus.Open);

  const transaction = await r.server.app.db.transaction();

  questResponse = await questResponse.update(
    {
      status: QuestsResponseStatus.Accepted,
    },
    { transaction },
  );
  questsResponseController.questsResponse = questResponse;

  const questChat = await QuestChat.findOne({
    where: { responseId: questResponse.id },
    include: {
      model: Chat.unscoped(),
      as: 'chat',
      include: [{ model: Message.unscoped(), as: 'lastMessage' }],
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
    userId: questResponse.quest.userId,
    messageAction: MessageAction.workerAcceptInviteOnQuest,
  });

  await Promise.all([
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    questResponse.update({ status: QuestsResponseStatus.Accepted }, { transaction }),
  ]);

  await transaction.commit();

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.workerAcceptedInvitationToQuest,
    recipients: [questResponse.quest.userId],
    data: questResponse,
  });

  return output();
}

export async function rejectInviteOnQuest(r) {
  let questResponse: QuestsResponse;
  const worker: User = r.auth.credentials;

  questResponse = await QuestsResponse.findOne({
    where: { id: r.params.responseId },
    include: { model: Quest, as: 'quest' },
  });
  const questsResponseController = new QuestsResponseController(questResponse);

  questsResponseController
    .workerMustBeInvitedToQuest(worker.id)
    .questsResponseMustHaveType(QuestsResponseType.Invite)
    .questsResponseMustHaveStatus(QuestsResponseStatus.Open);

  const transaction = await r.server.app.db.transaction();

  questResponse = await questResponse.update(
    {
      status: QuestsResponseStatus.Rejected,
    },
    { transaction },
  );
  questsResponseController.questsResponse = questResponse;

  //TODO In chat controller
  const questChat = await QuestChat.findOne({
    where: { responseId: questResponse.id },
    include: {
      model: Chat.unscoped(),
      as: 'chat',
      include: [
        {
          model: Message.unscoped(),
          as: 'lastMessage',
        },
      ],
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
    userId: questResponse.quest.userId,
    messageAction: MessageAction.workerRejectInviteOnQuest,
  });

  const [] = await Promise.all([
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    questChat.update({ status: QuestChatStatuses.Close }, { transaction }),
  ]);

  await transaction.commit();

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.workerRejectedInvitationToQuest,
    recipients: [questResponse.quest.userId],
    data: questResponse,
  });

  return output();
}

export async function rejectResponseOnQuest(r) {
  let questResponse: QuestsResponse;
  const employer: User = r.auth.credentials;

  questResponse = await QuestsResponse.findByPk(r.params.responseId, { include: { model: Quest, as: 'quest' } });
  const questsResponseController = new QuestsResponseController(questResponse);

  const questController = new QuestController(questResponse.quest); // TODO проверить

  await questController.employerMustBeQuestCreator(employer.id);

  questsResponseController.questsResponseMustHaveType(QuestsResponseType.Response).questsResponseMustHaveStatus(QuestsResponseStatus.Open);

  const transaction = await r.server.app.db.transaction();

  questResponse = await questResponse.update(
    {
      status: QuestsResponseStatus.Rejected,
    },
    { transaction },
  );
  questsResponseController.questsResponse = questResponse;

  const questChat = await QuestChat.findOne({
    where: { responseId: questResponse.id },
    include: {
      model: Chat.unscoped(),
      as: 'chat',
      include: [
        {
          model: Message.unscoped(),
          as: 'lastMessage',
        },
      ],
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
    userId: questResponse.workerId,
    messageAction: MessageAction.employerRejectResponseOnQuest,
  });

  await Promise.all([
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    QuestChat.update({ status: QuestChatStatuses.Close }, { where: { responseId: questResponse.id }, transaction }),
  ]);

  await transaction.commit();

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.employerRejectedWorkersResponse,
    recipients: [questResponse.quest.userId],
    data: questResponse,
  });

  return output();
}
