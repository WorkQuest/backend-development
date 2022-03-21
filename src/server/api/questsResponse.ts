import { Op } from 'sequelize';
import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { ChatNotificationActions, QuestNotificationActions } from '../controllers/controller.broker';
import { QuestsResponseController } from '../controllers/quest/controller.questsResponse';
import { QuestController } from '../controllers/quest/controller.quest';
import { UserController } from '../controllers/user/controller.user';
import { MediaController } from '../controllers/controller.media';
import { ChatController } from '../controllers/chat/controller.chat';
import {
  Chat, ChatData,
  ChatMember,
  Message,
  MessageAction,
  Quest,
  QuestChat,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
  QuestStatus,
  User,
  UserRole
} from "@workquest/database-models/lib/models";

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

  const chatController = await ChatController.createQuestChat(quest.userId, worker.id, quest.id, questResponse.id, transaction);
  const workerMember = chatController.chat.getDataValue('members').find(member => member.userId === r.auth.credentials.id);

  const message = await chatController.createInfoMessage(workerMember.id, chatController.chat.id, 1, workerMember.id, MessageAction.workerResponseOnQuest, transaction);

  await chatController.createChatMembersData(chatController.chat.getDataValue('members'), r.auth.credentials.id, message, transaction);
  await chatController.createChatData(chatController.chat.id, message.id, transaction);

  if (r.payload.message !== '') {
    const responseWorkerMessage = await chatController.createMessage(chatController.chat.id, workerMember.id, 2, r.payload.message, transaction);
    await responseWorkerMessage.$set('medias', medias, { transaction });
    await chatController.updateChatData(chatController.chat.id, responseWorkerMessage.id);
  }

  await transaction.commit();

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: [quest.userId],
    data: await Message.findByPk(message.id),
  });

  questResponse.setDataValue('quest', quest);
  questResponse.setDataValue('worker', workerController.shortCredentials);
  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.workerRespondedToQuest,
    recipients: [quest.userId],
    data: questResponse,
  });

  return output(chatController.chat);
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

  const chatController = await ChatController.createQuestChat(employer.id, invitedWorker.id, quest.id, questResponse.id, transaction);
  const employerMember = chatController.chat.getDataValue('members').find(member => member.userId === r.auth.credentials.id);

  const message = await chatController.createInfoMessage(employerMember.id, chatController.chat.id, 1, employerMember.id, MessageAction.employerInviteOnQuest, transaction);
  await chatController.createChatMembersData(chatController.chat.getDataValue('members'), r.auth.credentials.id, message, transaction);
  await chatController.createChatData(chatController.chat.id, message.id, transaction);

  if (r.payload.message !== '') {
    const inviteEmployerMessage = await chatController.createMessage(chatController.chat.id, employerMember.id, 2, r.payload.message, transaction);
    await chatController.updateChatData(chatController.chat.id, inviteEmployerMessage.id);
  }

  await transaction.commit();

  questResponse.setDataValue('quest', questController.quest);
  questResponse.setDataValue('employer', employerController.shortCredentials);

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: [quest.userId],
    data: await Message.findByPk(message.id),
  });

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.employerInvitedWorkerToQuest,
    recipients: [invitedWorker.id],
    data: questResponse,
  });

  return output(chatController.chat);
}
/** TODO: test */
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
/** TODO: test */
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

  const chat = await Chat.findOne({
    include: [{
      model: QuestChat,
      as: 'questChat',
      where: { responseId: questResponse.id }
    }, {
      model: ChatMember,
      as: 'meMember',
      where: { userId: r.auth.credentials.id },
    }, {
      model: ChatData,
      as: 'chatData',
    }],
  });
  const chatController = new ChatController(chat);

  const messageNumber = chat.chatData.lastMessage.number + 1;

  await chatController.createInfoMessage(chat.meMember.id, chat.id, messageNumber, chat.meMember.id, MessageAction.workerAcceptInviteOnQuest, transaction);


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

  const chat = await Chat.findOne({
    include: [{
      model: QuestChat,
      as: 'questChat',
      where: { responseId: questResponse.id }
    }, {
      model: ChatMember,
      as: 'meMember',
      where: { userId: r.auth.credentials.id },
    }, {
      model: ChatData,
      as: 'chatData',
    }],
  });
  const chatController = new ChatController(chat);

  const messageNumber = chat.chatData.lastMessage.number + 1;

  await chatController.createInfoMessage(chat.meMember.id, chat.id, messageNumber, chat.meMember.id, MessageAction.workerRejectInviteOnQuest, transaction);

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

  const chat = await Chat.findOne({
    include: [{
      model: QuestChat,
      as: 'questChat',
      where: { responseId: questResponse.id }
    }, {
      model: ChatMember,
      as: 'meMember',
      where: { userId: r.auth.credentials.id }
    }, {
      model: ChatData,
      as: 'chatData',
    }],
  });
  const chatController = new ChatController(chat);

  const messageNumber = chat.chatData.lastMessage.number + 1;
  await chatController.createInfoMessage(chat.meMember.id, chat.id, messageNumber, chat.meMember.id, MessageAction.employerRejectResponseOnQuest, transaction);

  await transaction.commit();

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.employerRejectedWorkersResponse,
    recipients: [questResponse.workerId],
    data: questResponse,
  });

  return output();
}
