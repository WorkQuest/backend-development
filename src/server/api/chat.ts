import { literal, Op } from 'sequelize';
import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { setMessageAsReadJob } from '../jobs/setMessageAsRead';
import { updateCountUnreadMessagesJob } from '../jobs/updateCountUnreadMessages';
import { resetUnreadCountMessagesOfMemberJob } from '../jobs/resetUnreadCountMessagesOfMember';
import { incrementUnreadCountMessageOfMembersJob } from '../jobs/incrementUnreadCountMessageOfMembers';
import { updateCountUnreadChatsJob } from '../jobs/updateCountUnreadChats';
import { ChatController } from '../controllers/chat/controller.chat';
import { ChatNotificationActions } from '../controllers/controller.broker';
import { MediaController } from '../controllers/controller.media';
import { MessageController } from '../controllers/chat/controller.message';
import { UserController } from '../controllers/user/controller.user';
import { listOfUsersByChatsCountQuery, listOfUsersByChatsQuery } from '../queries';
import {
  User,
  Chat,
  Message,
  ChatType,
  ChatMember,
  MessageType,
  InfoMessage,
  StarredChat,
  MessageAction,
  StarredMessage,
  QuestChatStatuses,
  SenderMessageStatus,
} from '@workquest/database-models/lib/models';

export const searchChatFields = ['name'];

export async function getUserChats(r) {
  const searchByQuestNameLiteral = literal(
    `(SELECT "title" FROM "Quests" WHERE "id" = ` + `(SELECT "questId" FROM "QuestChats" WHERE "chatId" = "Chat"."id")) ` + `ILIKE :query`,
  );
  const searchByFirstAndLastNameLiteral = literal(
    `(SELECT "firstName" || ' ' || "lastName" FROM "Users" WHERE "Users"."id" = ` +
      `(SELECT "userId" FROM "ChatMembers" WHERE "Chat"."type" = :chatType AND "chatId" = "Chat"."id" AND "userId" != :searcherId)) ` +
      `ILIKE :query`,
  );

  const where = {};
  const replacements = {};

  const include: any[] = [{
      model: ChatMember,
      where: { userId: r.auth.credentials.id },
      required: true,
      as: 'meMember',
    }, {
      model: StarredChat,
      as: 'star',
      where: { userId: r.auth.credentials.id },
      required: r.query.starred,
    }];

  if (r.query.q) {
    where[Op.or] = searchChatFields.map(field => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` }
    }));

    replacements['query'] = `%${r.query.q}%`;
    replacements['chatType'] = ChatType.private;
    replacements['searcherId'] = r.auth.credentials.id;

    where[Op.or] = [
      searchByQuestNameLiteral,
      searchByFirstAndLastNameLiteral,
    ];
  }

  const { count, rows } = await Chat.findAndCountAll({
    where,
    include,
    replacements,
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['lastMessageDate', r.query.sort.lastMessageDate]],
  });

  return output({ count, chats: rows });
}

export async function getChatMessages(r) {
  const chat = await Chat.findByPk(r.params.chatId, {
    include: {
      model: ChatMember,
      where: { memberId: r.auth.credentials.id },
      required: false,
      as: 'meMember',
    },
  });
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const { count, rows } = await Message.findAndCountAll({
    where: { chatId: chat.id },
    include: [
      {
        model: StarredMessage,
        as: 'star',
        where: { memberId: r.auth.credentials.id },
        required: r.query.starred,
      },
    ],
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', r.query.sort.createdAt]],
  });

  return output({ count, messages: rows, chat });
}

export async function getUserChat(r) {
  const chat = await Chat.findByPk(r.params.chatId, {
    include: {
      model: StarredChat,
      as: 'star',
      required: false,
    },
  });
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  return output(chat);
}

export async function listOfUsersByChats(r) {
  const options = {
    replacements: {
      currentUserId: r.auth.credentials.id,
      limitValue: r.query.limit,
      offsetValue: r.query.offset,
      excludeUsersFromChatId: r.query.excludeMembersChatId || '',
    },
  };

  const [countResults] = await r.server.app.db.query(listOfUsersByChatsCountQuery, options);
  const [userResults] = await r.server.app.db.query(listOfUsersByChatsQuery, options);

  const users = userResults.map((result) => ({
    id: result.id,
    firstName: result.firstName,
    lastName: result.lastName,
    additionalInfo: result.additionalInfo,
    avatarId: result.avatarId,
    avatar: {
      id: result['avatar.id'],
      url: result['avatar.url'],
      contentType: result['avatar.contentType'],
    },
  }));

  return output({ count: parseInt(countResults[0].count), users });
}

export async function getChatMembers(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const { count, rows } = await User.scope('shortWithAdditionalInfo').findAndCountAll({
    include: [
      {
        model: ChatMember,
        attributes: [],
        as: 'chatMember',
        where: { chatId: chat.id },
      },
    ],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, members: rows });
}

export async function createGroupChat(r) {
  const memberUserIds: string[] = r.payload.memberUserIds;

  if (!memberUserIds.includes(r.auth.credentials.id)) {
    memberUserIds.push(r.auth.credentials.id);
  }

  await UserController.usersMustExist(memberUserIds);

  const transaction = await r.server.app.db.transaction();

  const groupChat = await Chat.create(
    {
      name: r.payload.name,
      ownerMemberId: r.auth.credentials.id,
      type: ChatType.group,
    },
    { transaction },
  );

  const message = await Message.build({
    senderMemberId: r.auth.credentials.id,
    chatId: groupChat.id,
    type: MessageType.info,
    number: 1 /** Because created */,
  });

  const infoMessage = await InfoMessage.build({
    messageId: message.id,
    messageAction: MessageAction.groupChatCreate,
  });

  await Promise.all([message.save({ transaction }), infoMessage.save({ transaction })]);

  await groupChat.update(
    {
      lastMessageId: message.id,
      lastMessageDate: message.createdAt,
    },
    { transaction },
  );

  const chatMembers = memberUserIds.map((userId) => {
    return {
      userId,
      chatId: groupChat.id,
      unreadCountMessages: userId === r.auth.credentials.id ? 0 : 1,
      lastReadMessageId: userId === r.auth.credentials.id ? message.id : null,
      lastReadMessageNumber: userId === r.auth.credentials.id ? message.number : null,
    };
  });

  await ChatMember.bulkCreate(chatMembers, { transaction });

  await transaction.commit();

  const result = await Chat.findByPk(groupChat.id);

  await updateCountUnreadChatsJob({ userIds: memberUserIds });

  r.server.app.broker.sendChatNotification({
    recipients: memberUserIds.filter((userId) => userId !== r.auth.credentials.id),
    action: ChatNotificationActions.groupChatCreate,
    data: result, // TODO lastReadMessageId: message.id
  });

  return output(result);
}

export async function sendMessageToUser(r) {
  if (r.params.userId === r.auth.credentials.id) {
    return error(Errors.InvalidPayload, "You can't send a message to yourself", {});
  }

  await UserController.userMustExist(r.params.userId);

  const medias = await MediaController.getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  const message = await Message.build({
    senderMemberId: r.auth.credentials.id,
    type: MessageType.message,
    senderStatus: SenderMessageStatus.unread,
    text: r.payload.text,
    createdAt: Date.now(),
  });

  const [chat, isChatCreated] = await Chat.findOrCreate({
    where: { type: ChatType.private },
    include: [
      {
        model: ChatMember,
        as: 'firstMemberInPrivateChat',
        where: { memberId: r.params.userId },
        required: true,
        attributes: [],
      },
      {
        model: ChatMember,
        as: 'secondMemberInPrivateChat',
        where: { memberId: r.auth.credentials.id },
        required: true,
        attributes: [],
      },
    ],
    defaults: {
      type: ChatType.private,
      lastMessageId: message.id,
      lastMessageDate: message.createdAt,
    },
    transaction,
  });

  const lastMessage = await Message.findOne({
    order: [['createdAt', 'DESC']],
    where: { chatId: chat.id },
  });

  message.chatId = chat.id;
  message.number = lastMessage ? (message.number = lastMessage.number + 1) : (message.number = 1);

  await message.save({ transaction });
  await message.$set('medias', medias, { transaction });

  if (isChatCreated) {
    await ChatMember.bulkCreate(
      [
        {
          unreadCountMessages: 0 /** Because created */,
          chatId: chat.id,
          memberId: r.auth.credentials.id,
          lastReadMessageId: message.id /** Because created */,
          lastReadMessageNumber: message.number,
        },
        {
          unreadCountMessages: 1 /** Because created */,
          chatId: chat.id,
          memberId: r.params.userId,
          lastReadMessageId: null /** Because created */,
          lastReadMessageNumber: null,
        },
      ],
      { transaction },
    );
  } else {
    await chat.update(
      {
        lastMessageId: message.id,
        lastMessageDate: message.createdAt,
      },
      { transaction },
    );
  }

  await transaction.commit();

  if (!isChatCreated) {
    await resetUnreadCountMessagesOfMemberJob({
      chatId: chat.id,
      lastReadMessageId: message.id,
      userId: r.auth.credentials.id,
      lastReadMessageNumber: message.number,
    });

    await incrementUnreadCountMessageOfMembersJob({
      chatId: chat.id,
      notifierUserId: r.auth.credentials.id,
    });
  }

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chat.id,
    senderId: r.auth.credentials.id,
  });
  await updateCountUnreadChatsJob({
    userIds: [r.auth.credentials.id, r.params.userId],
  });

  const result = await Message.findByPk(message.id);

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: [r.params.userId],
    data: result,
  });

  return output(result);
}

export async function sendMessageToChat(r) {
  const medias = await MediaController.getMedias(r.payload.medias);
  const chat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  if (chat.type === ChatType.quest) {
    chatController.questChatMastHaveStatus(QuestChatStatuses.Open);
  }

  const transaction = await r.server.app.db.transaction();

  const lastMessage = await Message.findOne({
    order: [['createdAt', 'DESC']],
    where: { chatId: chat.id },
  });

  const message = await Message.create(
    {
      senderMemberId: r.auth.credentials.id,
      chatId: chat.id,
      type: MessageType.message,
      text: r.payload.text,
      senderStatus: SenderMessageStatus.unread,
      number: lastMessage.number + 1,
    },
    { transaction },
  );

  await message.$set('medias', medias, { transaction });

  await chat.update(
    {
      lastMessageId: message.id,
      lastMessageDate: message.createdAt,
    },
    { transaction },
  );

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, memberId: { [Op.ne]: r.auth.credentials.id } },
  });
  const userIdsWithoutSender = membersWithoutSender.map((member) => member.userId);
  const result = await Message.findByPk(message.id);

  await resetUnreadCountMessagesOfMemberJob({
    chatId: chat.id,
    lastReadMessageId: message.id,
    userId: r.auth.credentials.id,
    lastReadMessageNumber: message.number,
  });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: chat.id,
    notifierUserId: r.auth.credentials.id,
  });

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderId: r.auth.credentials.id,
  });

  await updateCountUnreadChatsJob({
    userIds: [r.auth.credentials.id, ...userIdsWithoutSender],
  });

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: userIdsWithoutSender,
    data: result,
  });

  return output(result);
}

export async function addUsersInGroupChat(r) {
  const userIds: string[] = r.payload.userIds;
  const users = await UserController.usersMustExist(userIds, 'shortWithAdditionalInfo');

  const groupChat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(groupChat);

  await chatController.chatMustHaveType(ChatType.group).chatMustHaveOwner(r.auth.credentials.id).usersNotExistInGroupChat(userIds);

  const messages: Message[] = [];
  const infoMessages: InfoMessage[] = [];

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const messageNumber = groupChat.lastMessage.number + i + 1;

    const message = Message.build({
      chatId: groupChat.id,
      type: MessageType.info,
      senderMemberId: r.auth.credentials.id,
      number: messageNumber,
      createdAt: Date.now() + i * 100,
    });
    const infoMessage = InfoMessage.build({
      memberId: userId,
      messageId: message.id,
      messageAction: MessageAction.groupChatAddUser,
    });

    messages.push(message);
    infoMessages.push(infoMessage);
  }

  const lastMessage = messages[messages.length - 1];
  const transaction = await r.server.app.db.transaction();

  const members = userIds.map((userId) => {
    return {
      chatId: groupChat.id,
      memberId: userId,
      unreadCountMessages: 1 /** Because info message */,
      lastReadMessageId: groupChat.lastMessage.id /** Because new member */,
    };
  });
  await ChatMember.bulkCreate(members, { transaction });

  let messagesResult = await Promise.all(messages.map((_) => _.save({ transaction })));
  const infoMessagesResult = await Promise.all(infoMessages.map((_) => _.save({ transaction })));

  await groupChat.update(
    {
      lastMessageId: lastMessage.id,
      lastMessageDate: lastMessage.createdAt,
    },
    { transaction },
  );

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: groupChat.id, memberId: { [Op.ne]: r.auth.credentials.id } },
  });
  const userIdsInChatWithoutSender = membersWithoutSender.map((member) => member.userId);

  messagesResult = messagesResult.map((message) => {
    const keysMessage: { [key: string]: any } = message.toJSON();
    const keysInfoMessage = infoMessagesResult.find((_) => _.messageId === message.id).toJSON() as InfoMessage;

    keysInfoMessage.member = users.find((_) => _.id === keysInfoMessage.memberId).toJSON() as User;

    keysMessage.infoMessage = keysInfoMessage;

    return keysMessage;
  }) as Message[];

  await resetUnreadCountMessagesOfMemberJob({
    chatId: groupChat.id,
    lastReadMessageId: lastMessage.id,
    userId: r.auth.credentials.id,
    lastReadMessageNumber: lastMessage.number,
  });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: groupChat.id,
    notifierUserId: r.auth.credentials.id,
  });

  await updateCountUnreadChatsJob({
    userIds: [r.auth.credentials.id, ...userIdsInChatWithoutSender],
  });

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.groupChatAddUser,
    recipients: userIdsInChatWithoutSender,
    data: messagesResult,
  });

  return output(messagesResult);
}

export async function removeUserInGroupChat(r) {
  await UserController.userMustExist(r.params.userId);

  const groupChat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(groupChat);

  chatController.chatMustHaveType(ChatType.group).chatMustHaveOwner(r.auth.credentials.id);

  await chatController.chatMustHaveMember(r.params.userId);

  const transaction = await r.server.app.db.transaction();

  await ChatMember.destroy({
    where: {
      chatId: groupChat.id,
      memberId: r.params.userId,
    },
    transaction,
  });

  const message = await Message.create(
    {
      senderMemberId: r.auth.credentials.id,
      chatId: groupChat.id,
      type: MessageType.info,
      number: groupChat.lastMessage.number + 1,
    },
    { transaction },
  );

  await InfoMessage.create(
    {
      memberId: r.params.userId,
      messageId: message.id,
      messageAction: MessageAction.groupChatDeleteUser,
    },
    { transaction },
  );

  await groupChat.update(
    {
      lastMessageId: message.id,
      lastMessageDate: message.createdAt,
    },
    { transaction },
  );

  await transaction.commit();

  const result = await Message.findByPk(message.id);
  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: groupChat.id, memberId: { [Op.ne]: r.auth.credentials.id } },
  });
  const userIdsWithoutSender = membersWithoutSender.map((member) => member.userId);

  await resetUnreadCountMessagesOfMemberJob({
    chatId: groupChat.id,
    lastReadMessageId: message.id,
    userId: r.auth.credentials.id,
    lastReadMessageNumber: message.number,
  });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: groupChat.id,
    notifierUserId: r.auth.credentials.id,
  });

  await updateCountUnreadChatsJob({
    userIds: [r.auth.credentials.id, ...userIdsWithoutSender],
  });

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.groupChatDeleteUser,
    recipients: userIdsWithoutSender,
    data: result,
  });

  return output(result);
}

export async function leaveFromGroupChat(r) {
  const groupChat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(groupChat);

  await chatController.chatMustHaveType(ChatType.group);
  await chatController.chatMustHaveMember(r.auth.credentials.id);

  if (groupChat.ownerMemberId === r.auth.credentials.id) {
    return error(Errors.Forbidden, 'User is chat owner', {}); // TODO
  }

  const transaction = await r.server.app.db.transaction();

  await ChatMember.destroy({
    where: { chatId: groupChat.id, memberId: r.auth.credentials.id },
    transaction,
  });

  const message = await Message.create(
    {
      senderMemberId: r.auth.credentials.id,
      chatId: groupChat.id,
      type: MessageType.info,
      number: groupChat.lastMessage.number + 1,
    },
    { transaction },
  );

  await InfoMessage.create(
    {
      messageId: message.id,
      // memberId: r.auth.credentials.id,
      messageAction: MessageAction.groupChatLeaveUser,
    },
    { transaction },
  );

  await groupChat.update(
    {
      lastMessageId: message.id,
      lastMessageDate: message.createdAt,
    },
    { transaction },
  );

  await transaction.commit();

  const result = await Message.findByPk(message.id);
  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: groupChat.id, memberId: { [Op.ne]: r.auth.credentials.id } },
  });
  const userIdsWithoutSender = membersWithoutSender.map((member) => member.userId);

  await incrementUnreadCountMessageOfMembersJob({
    chatId: groupChat.id,
    notifierUserId: r.auth.credentials.id,
  });

  await updateCountUnreadChatsJob({
    userIds: [r.auth.credentials.id, ...userIdsWithoutSender],
  });

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.groupChatLeaveUser,
    recipients: userIdsWithoutSender,
    data: result,
  });

  return output(result);
}

export async function setMessagesAsRead(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const message = await Message.findByPk(r.payload.messageId);

  if (!message) {
    return error(Errors.NotFound, 'Message is not found', {});
  }

  const otherSenders = await Message.unscoped().findAll({
    attributes: ['senderMemberId'],
    where: {
      chatId: chatController.chat.id,
      senderMemberId: { [Op.ne]: r.auth.credentials.id },
      senderStatus: SenderMessageStatus.unread,
      number: { [Op.gte]: message.number },
    },
    group: ['senderMemberId'],
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chat.id,
    readerUserId: r.auth.credentials.id,
  });

  if (otherSenders.length === 0) {
    return output();
  }

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderId: r.auth.credentials.id,
  });

  await updateCountUnreadChatsJob({
    userIds: [r.auth.credentials.id],
  });

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.messageReadByRecipient,
    recipients: otherSenders.map((sender) => sender.senderMemberId),
    data: message,
  });

  return output();
}

export async function getUserStarredMessages(r) {
  const { count, rows } = await Message.findAndCountAll({
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    include: [
      {
        model: StarredMessage,
        as: 'star',
        where: { userId: r.auth.credentials.id },
        required: true,
      },
      {
        model: Chat.unscoped(),
        as: 'chat',
      },
    ],
  });

  return output({ count, messages: rows });
}

export async function markMessageStar(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  const message = await Message.findByPk(r.params.messageId);

  const chatController = new ChatController(chat);
  const messageController = new MessageController(message);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  await StarredMessage.create({
    memberId: r.auth.credentials.id,
    messageId: r.params.messageId,
  });

  return output();
}

export async function removeStarFromMessage(r) {
  const starredMessage = await StarredMessage.findOne({
    where: {
      messageId: r.params.messageId,
      memberId: r.auth.credentials.id,
    },
  });

  if (!starredMessage) {
    return error(Errors.Forbidden, 'Message or message with star not fount', {});
  }

  await starredMessage.destroy();

  return output();
}

export async function markChatStar(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  await StarredChat.create({
    memberId: r.auth.credentials.id,
    chatId: r.params.chatId,
  });

  return output();
}

export async function removeStarFromChat(r) {
  await ChatController.chatMustExists(r.params.chatId);

  //TODO: что делать до звёздочкой, если исключили из чата?
  //await chat.mustHaveMember(r.auth.credentials.id);

  await StarredChat.destroy({
    where: {
      chatId: r.params.chatId,
      memberId: r.auth.credentials.id,
    },
  });

  return output();
}
