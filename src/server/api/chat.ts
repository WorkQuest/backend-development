import { literal, Op } from "sequelize";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { setMessageAsReadJob }  from "../jobs/setMessageAsRead";
import { MediaController } from "../controllers/controller.media";
import {
  ChecksListChat,
  ChecksListGroupChat,
  ChecksListPrivateChat,
  ChecksListQuestChat
} from '../checks-list/checksList.chat';
import { ChatNotificationActions } from "../controllers/controller.broker";
import { MessageController } from "../controllers/chat/controller.message";
import { updateCountUnreadChatsJob }  from "../jobs/updateCountUnreadChats";
import { UserControllerFactory } from '../factories/factory.userController';
import { updateCountUnreadMessagesJob }  from "../jobs/updateCountUnreadMessages";
import { resetUnreadCountMessagesOfMemberJob }  from "../jobs/resetUnreadCountMessagesOfMember";
import { incrementUnreadCountMessageOfMembersJob }  from "../jobs/incrementUnreadCountMessageOfMembers";
import { ChatController, GroupChatController, PrivateChatController } from '../controllers/chat/controller.chat';
import {
  listOfUsersByChatsQuery,
  listOfUsersByChatsCountQuery,
} from "../queries";
import {
  User,
  Chat,
  Message,
  ChatData,
  ChatType,
  QuestChat,
  GroupChat,
  ChatMember,
  InfoMessage,
  StarredChat,
  MemberStatus,
  MessageAction,
  StarredMessage,
  QuestChatStatuses,
  SenderMessageStatus,
  ChatMemberDeletionData,
} from "@workquest/database-models/lib/models";
import {
  ChatControllerFactory,
  GroupChatControllerFactory,
  QuestChatControllerFactory
} from '../factories/factory.chatController';

export const searchChatFields = ['name'];

//TODO: improve getDataValue('meMember') to meMember, do tests

export async function getUserChats(r) {
  const searchByQuestNameLiteral = literal(
    `(SELECT "title" FROM "Quests" WHERE "id" = ` +
    `(SELECT "questId" FROM "QuestChats" WHERE "chatId" = "Chat"."id")) ` +
    ` ILIKE :query`,
  );
  const searchByFirstAndLastNameLiteral = literal(
    `1 = (CASE WHEN EXISTS (SELECT "firstName", "lastName" FROM "Users" as "userMember" ` +
    `INNER JOIN "ChatMembers" AS "member" ON "userMember"."id" = "member"."userId" AND "member"."chatId" = "Chat"."id" ` +
    `WHERE "userMember"."firstName" || ' ' || "userMember"."lastName" ILIKE :query AND "userMember"."id" <> :searcherId) THEN 1 ELSE 0 END ) `,
  );

  /**TODO: попытаться сократить запрос*/
  const orderByMessageDateLiteral = literal(
    '(CASE WHEN EXISTS (SELECT "Messages"."createdAt" FROM "ChatMemberDeletionData" INNER JOIN "Messages" ON "beforeDeletionMessageId" = "Messages"."id" ' +
    'INNER JOIN "ChatMembers" ON "ChatMemberDeletionData"."beforeDeletionMessageId" = "ChatMembers"."id" WHERE "ChatMembers"."chatId" = "Chat"."id") ' +
    'THEN (SELECT "Messages"."createdAt" FROM "ChatMemberDeletionData" INNER JOIN "Messages" ON "beforeDeletionMessageId" = "Messages"."id" INNER JOIN "ChatMembers" ON "ChatMemberDeletionData"."beforeDeletionMessageId" = "ChatMembers"."id" WHERE "ChatMembers"."chatId" = "Chat"."id") ' +
    'ELSE (SELECT "Messages"."createdAt" FROM "ChatData" INNER JOIN "Messages" ON "lastMessageId" = "Messages"."id" WHERE "ChatData"."chatId" = "Chat"."id") END)'
  );

  const where = {};
  const replacements = {};

  const include: any[] = [{
    model: ChatMember,
    where: { userId: r.auth.credentials.id },
    include: {
      model: ChatMemberDeletionData,
      as: 'chatMemberDeletionData',
      include: [{
        model: Message.unscoped(),
        as: 'beforeDeletionMessage'
      }]
    },
    required: true,
    as: 'meMember',
  }, {
    model: StarredChat,
    where: { userId: r.auth.credentials.id },
    as: 'star',
    required: r.query.starred,
  }, {
    model: ChatData,
    as: 'chatData',
    include: [{
      model: Message,
      as: 'lastMessage'
    }]
  }];

  if (r.query.q) {
    where[Op.or] = searchChatFields.map(field => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` }
    }));

    where[Op.or].push(searchByQuestNameLiteral, searchByFirstAndLastNameLiteral);

    replacements['query'] = `%${r.query.q}%`;
    replacements['searcherId'] = r.auth.credentials.id;
  }

  const { count, rows } = await Chat.findAndCountAll({
    where,
    include,
    replacements,
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [[orderByMessageDateLiteral, r.query.sort.lastMessageDate]],
  });

  return output({ count, chats: rows });
}

export async function getChatMessages(r) {
  const chat = await Chat.findByPk(r.params.chatId, {
    include: {
      model: ChatMember,
      where: { userId: r.auth.credentials.id },
      include: [{
        model: ChatMemberDeletionData,
        include: [{
          model: Message.unscoped(),
          as: 'beforeDeletionMessage'
        }],
        as: 'chatMemberDeletionData'
      }],
      required: false,
      as: 'meMember',
    },
  });
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const where = {
    chatId: chat.id,
    ...(chat.meMember.chatMemberDeletionData && {createdAt: {[Op.lte]: chat.meMember.chatMemberDeletionData.beforeDeletionMessage.createdAt}})
  }

  const { count, rows } = await Message.findAndCountAll({
    where,
    include: [
      {
        model: StarredMessage,
        as: 'star',
        where: { userId: r.auth.credentials.id },
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
    include: [{
      model: StarredChat,
      as: 'star',
      required: false,
    }, {
      model: QuestChat,
      as: 'questChat',
      required: false,
    }],
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
  const exceptDeletedUsersLiteral = literal(
    '(1 = (CASE WHEN EXISTS (SELECT "chatMemberId" FROM "ChatMemberDeletionData" INNER JOIN "ChatMembers" ON "User"."id" = "ChatMembers"."userId" WHERE "ChatMemberDeletionData"."chatMemberId" = "ChatMembers"."id") THEN 0 ELSE 1 END))'
  );

  const where = {};
  where[Op.or] = exceptDeletedUsersLiteral;

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
        include: [{
          model: ChatMemberDeletionData,
          as: 'chatMemberDeletionData'
        }]
      },
    ],
    where,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, members: rows });
}

export async function createGroupChat(r) {
  const userChatOwner = r.auth.credentials;

  const chatName = r.payload.name;
  const userMemberIds: string[] = r.payload.userIds;

  if (!userMemberIds.includes(r.auth.credentials.id)) {
    userMemberIds.push(r.auth.credentials.id);
  }

  const userControllerMembers = await UserControllerFactory.createByIds(userMemberIds);

  const groupChatController = await r.server.app.db.transaction(async (tx) => {
    return GroupChatController.create({
      users: userControllerMembers.map(userController => userController.user),
      userOwner: userChatOwner,
      name: chatName,
    }, { tx });
  }) as GroupChatController;

  const chatDto = await groupChatController.toDtoResult();

  r.server.app.broker.sendChatNotification({
    recipients: userMemberIds.filter((id) => id !== userChatOwner.id),
    action: ChatNotificationActions.groupChatCreate,
    data: chatDto,
  });

  return output(chatDto);
}

export async function sendMessageToUser(r) {
  const { text, medias } = r.payload as { text: string, medias: string[] }

  const senderUser: User = r.auth.credentials;

  const recipientUserId: string = r.params.userId;

  ChecksListPrivateChat
    .checkDontSendMe(senderUser.id, recipientUserId)

  const recipientUserController = await UserControllerFactory.createById(recipientUserId);

  const mediaModels = await MediaController.getMedias(medias);

  const [privateChatController, message] = await r.server.app.db.transaction(async (tx) => {
    const privateChatController = await PrivateChatController.findOrCreate({
      senderUser: senderUser,
      recipientUser: recipientUserController.user,
    }, { tx });

    const message = await privateChatController.sendMessage({
      text,
      medias: mediaModels,
      senderMember: privateChatController.members.senderMember,
    }, { tx });

    return [privateChatController, message];
  }) as Readonly<[PrivateChatController, Message]>;

  await incrementUnreadCountMessageOfMembersJob({
    chatId: privateChatController.chat.id,
    skipMemberIds: [privateChatController.members.senderMember.id],
  });
  await setMessageAsReadJob({
    chatId: privateChatController.chat.id,
    lastUnreadMessage: { id: message.id, number: message.number },
    senderMemberId: privateChatController.members.senderMember.id,
  });
  await updateCountUnreadChatsJob({
    userIds: [senderUser.id, recipientUserController.user.id],
  });

  r.server.app.broker.sendChatNotification({
    data: message,
    action: ChatNotificationActions.newMessage,
    recipients: [privateChatController.members.recipientMember.userId],
  });

  return output(message);
}

export async function sendMessageToChat(r) {
  const senderUser: User = r.auth.credentials;

  const chatId: string = r.params.chatId;
  const { text, medias } = r.payload as { text: string, medias: string[] }

  const mediaModels = await MediaController.getMedias(medias);

  const chatController = await ChatControllerFactory.createById(chatId);
  const checksListChat = new ChecksListChat(chatController.chat);

  await checksListChat
    .checkUserMemberMustBeInChat(senderUser)

  if (chatController.chat.type === ChatType.quest) {
    const questChatController = await QuestChatControllerFactory.createById(chatId);

    const checksListQuestChat = new ChecksListQuestChat(
      questChatController.chat,
      questChatController.questChat
    );

    await checksListQuestChat
      .checkQuestChatMastHaveStatus(QuestChatStatuses.Open)
  }

  const [message, senderMember] = await r.server.app.db.transaction(async (tx) => {
    const senderMember = await chatController.getUserMember(senderUser);

    const message = chatController.sendMessage({
      text,
      senderMember,
      medias: mediaModels,
    }, { tx });

    return [message, senderMember];
  }) as [Message, ChatMember];

  const members = await chatController.getMembers();
  const membersWithoutSenderMember = members.filter(m => m.id !== senderMember.id);

  await resetUnreadCountMessagesOfMemberJob({
    memberId: senderMember.id,
    lastReadMessageId: message.id,
    chatId: chatController.chat.id,
    lastReadMessageNumber: message.number,
  });
  await incrementUnreadCountMessageOfMembersJob({
    chatId: chatController.chat.id,
    skipMemberIds: [senderMember.id],
  });
  await setMessageAsReadJob({
    chatId: r.params.chatId,
    senderMemberId: chatController.chat.meMember.id,
    lastUnreadMessage: { id: message.id, number: message.number },
  });
  await updateCountUnreadChatsJob({
    userIds: ,
  });

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: ,
    data: message,
  });

  return output(message);
}

export async function removeUserFromGroupChat(r) {
  const user: User = r.auth.credentials;

  const { userId, chatId } = r.params as { userId: string, chatId: string };

  const userController = await UserControllerFactory.createById(userId);
  const groupChatController = await GroupChatControllerFactory.createById(chatId);
  const checksListChat = new ChecksListGroupChat(groupChatController.chat, groupChatController.groupChat);

  const meMember = await groupChatController.getUserMember(user);

  await checksListChat
    .checkChatMustHaveType(ChatType.group)
    .checkGroupChatMustHaveOwnerMember(meMember.id)
    .checkChatMustHaveMember(userId)

  await r.server.app.db.transaction(async (tx) => {

  });

  const transaction = await r.server.app.db.transaction();

  const removedChatMember = chatController.chat.members.find(member => member.userId === r.params.userId);

  const messageNumber = chat.chatData.lastMessage.number + 1;

  const message = await chatController.createInfoMessage(chat.meMember.id, chatController.chat.id, messageNumber, removedChatMember.id, MessageAction.groupChatDeleteUser, transaction);

  await chat.chatData.update({ lastMessageId: message.id }, { transaction });

  await chatController.createChatMemberDeletionData(removedChatMember.id, message.id, message.number, transaction);

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, userId: { [Op.ne]: r.auth.credentials.id } },
  });

  const userIdsWithoutSender = membersWithoutSender.map((member) => member.userId);

  /** TODO: refactor jobs*/
  await resetUnreadCountMessagesOfMemberJob({
    chatId: chat.id,
    lastReadMessageId: message.id,
    memberId: chat.meMember.id,
    lastReadMessageNumber: message.number,
  });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: chat.id,
    notifierMemberId: chat.meMember.id,
  });

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chatController.chat.id,
    senderMemberId: chat.meMember.id,
  });

  await updateCountUnreadChatsJob({
    userIds: [r.auth.credentials.id, ...userIdsWithoutSender],
  });

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.groupChatDeleteUser,
    recipients: userIdsWithoutSender,
    data: message,
  });

  return output(message);
}

export async function leaveFromGroupChat(r) {
  const chat = await Chat.findByPk(r.params.chatId, {
    include: [{
      model: GroupChat,
      as: 'groupChat',
    }, {
      model: ChatData,
      as: 'chatData',
    }, {
      model: ChatMember,
      as: 'members',
      where: {
        userId: { [Op.ne]: r.auth.credentials.id }
      }
    }, {
      model: ChatMember,
      as: 'meMember',
      where: { userId: r.auth.credentials.id },
    }]
  });
  const chatController = new ChatController(chat);

  if (chat.groupChat.ownerMemberId === chat.meMember.id) {
    return error(Errors.Forbidden, 'User is chat owner', {});
  }

  await chatController
    .chatMustHaveType(ChatType.group)
    .chatMustHaveMember(r.auth.credentials.id);

  const transaction = await r.server.app.db.transaction();

  const messageNumber = chat.chatData.lastMessage.number + 1;
  const message = await chatController.createInfoMessage(chatController.chat.meMember.id, chatController.chat.id, messageNumber, chatController.chat.meMember.id, MessageAction.groupChatLeaveUser, transaction);

  await chatController.chat.chatData.update({ lastMessageId: message.id }, { transaction });

  await chatController.createChatMemberDeletionData(chat.meMember.id, message.id, message.number, transaction);

  await transaction.commit();

  const result = await Message.findByPk(message.id);
  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } },
  });
  const userIdsWithoutSender = membersWithoutSender.map((member) => member.userId);

  await incrementUnreadCountMessageOfMembersJob({
    chatId: chat.id,
    notifierMemberId: chat.meMember.id,
  });

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chatController.chat.id,
    senderMemberId: chat.meMember.id,
  });

  await updateCountUnreadChatsJob({
    userIds: [r.auth.credentials.id, ...userIdsWithoutSender],
  });

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.groupChatLeaveUser,
    recipients: chat.members,//userIdsWithoutSender,
    data: result,
  });

  return output(result);
}

export async function addUsersInGroupChat(r) {
  const userIds: string[] = r.payload.userIds;
  await UserController.usersMustExist(userIds, 'shortWithAdditionalInfo');

  const chat = await Chat.findByPk(r.params.chatId, {
    include: [
      {
        model: ChatMember,
        as: 'meMember',
        where: { userId: r.auth.credentials.id }
      },
      {
        model: ChatData,
        as: 'chatData',
      },
      {
        model: GroupChat,
        as: 'groupChat',
      }

    ]
  });
  const chatController = new ChatController(chat);

  await chatController
    .chatMustHaveType(ChatType.group)
    .chatMustHaveOwner(chat.meMember.id)
    .usersNotExistInGroupChat(userIds);

  const transaction = await r.server.app.db.transaction();

  const newMembers = await chatController.createChatMembers(userIds, chat.id, transaction);

  const messages: Message[] = [];
  for (let i = 0; i < newMembers.length; i++) {
    const memberId = newMembers[i].id;
    const messageNumber = chat.chatData.lastMessage.number + 1;

    const message = await chatController.createInfoMessage(chatController.chat.meMember.id, chatController.chat.id, messageNumber, memberId, MessageAction.groupChatAddUser, transaction);

    messages.push(message);
  }

  const lastMessage = messages[messages.length - 1];
  await chatController.createChatMembersData(newMembers, r.auth.credentials.id, lastMessage, transaction);

  await chat.chatData.update({ lastMessageId: lastMessage.id }, { transaction } );

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, userId: { [Op.ne]: r.auth.credentials.id } },
  });

  const chatMembers = await ChatMember.findAll({ where: { chatId: chat.id, status: MemberStatus.Active }});

  const userIdsInChatWithoutSender = membersWithoutSender.map((member) => member.userId);

  const messagesResult = messages.map((message) => {
    const keysMessage: { [key: string]: any } = message.toJSON();
    const keysInfoMessage = message.getDataValue('infoMessage').toJSON() as InfoMessage;

    keysInfoMessage.member = chatMembers.find((_) => _.id === keysInfoMessage.memberId).toJSON() as ChatMember;

    keysMessage.infoMessage = keysInfoMessage;

    return keysMessage;
  }) as Message[];

  const newMembersIds = newMembers.map(member => { return member.id });

  await resetUnreadCountMessagesOfMemberJob({
    chatId: chat.id,
    lastReadMessageId: lastMessage.id,
    memberId: chatController.chat.meMember.id,
    lastReadMessageNumber: lastMessage.number,
  });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: chat.id,
    notifierMemberId: chatController.chat.meMember.id,
    withoutMemberIds: newMembersIds, //у тех, кого добавили уже будет одно непрочитанное, не нужно его увеличивать ещё на один,
  });

  await updateCountUnreadChatsJob({
    userIds: [r.auth.credentials.id, ...userIdsInChatWithoutSender],
  });

  await setMessageAsReadJob({
    lastUnreadMessage: { id: lastMessage.id, number: lastMessage.number },
    chatId: r.params.chatId,
    senderMemberId: chat.meMember.id,
  });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatAddUser,
  //   recipients: userIdsInChatWithoutSender,
  //   data: messagesResult,
  // });

  return output(messagesResult);
}

export async function setMessagesAsRead(r) {
  const chat = await Chat.findByPk(r.params.chatId, {
    include: [{
      model: ChatMember,
      as: 'meMember',
      where: { userId: r.auth.credentials.id }
    }]
  });
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
      senderMemberId: { [Op.ne]: chat.meMember.id },
      senderStatus: SenderMessageStatus.unread,
      number: { [Op.gte]: message.number },
    },
    group: ['senderMemberId'],
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chat.id,
    readerMemberId: chat.meMember.id,
  });

  if (otherSenders.length === 0) {
    return output();
  }

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderMemberId: chat.meMember.id,
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

  await StarredMessage.findOrCreate({
    where: {
      userId: r.auth.credentials.id,
      messageId: r.params.messageId,
    },
    defaults: {
      userId: r.auth.credentials.id,
      messageId: r.params.messageId,
    }
  });

  return output();
}

export async function removeStarFromMessage(r) {
  const starredMessage = await StarredMessage.findOne({
    where: {
      messageId: r.params.messageId,
      userId: r.auth.credentials.id,
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

  await StarredChat.findOrCreate({
    where: {
      userId: r.auth.credentials.id,
      chatId: r.params.chatId,
    },
    defaults: {
      userId: r.auth.credentials.id,
      chatId: r.params.chatId,
    }
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
      userId: r.auth.credentials.id,
    },
  });

  return output();
}
