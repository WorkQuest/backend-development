import { literal, Op } from "sequelize";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { ChatController } from "../controllers/chat/controller.chat";
import { ChatNotificationActions } from "../controllers/controller.broker";
import { MediaController } from "../controllers/controller.media";
import { UserController } from "../controllers/user/controller.user";
import { MessageController } from "../controllers/chat/controller.message";
import { listOfUsersByChatsCountQuery, listOfUsersByChatsQuery } from "../queries";
import {
  Chat,
  ChatData,
  ChatMember,
  ChatMemberDeletionData,
  ChatType,
  GroupChat, MemberType,
  Message,
  MessageAction,
  SenderMessageStatus,
  StarredChat,
  StarredMessage,
  User
} from "@workquest/database-models/lib/models";

export const searchChatFields = ['name'];

export async function getUserChats(r) {
  const searchByQuestNameLiteral = literal(
    `(SELECT "title" FROM "Quests" WHERE "id" = ` + `(SELECT "questId" FROM "QuestChats" WHERE "chatId" = "Chat"."id")) ` + `ILIKE :query`,
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
  }
  ];

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
  const memberUserIds: string[] = r.payload.memberUserIds;

  if (!memberUserIds.includes(r.auth.credentials.id)) {
    memberUserIds.push(r.auth.credentials.id);
  }

  await UserController.usersMustExist(memberUserIds);

  const transaction = await r.server.app.db.transaction();

  const chatController = await ChatController.createGroupChat(memberUserIds, r.payload.name, r.auth.credentials.id, transaction);

  const meMember = chatController.chat.getDataValue('members').find(member => member.userId === r.auth.credentials.id);

  const message = await chatController.createInfoMessage(meMember.id, chatController.chat.id, 1, meMember.id, MessageAction.groupChatCreate, transaction);
  await chatController.createChatMembersData(chatController.chat.getDataValue('members'), r.auth.credentials.id, message, transaction);
  await chatController.createChatData(chatController.chat.id, message.id, transaction);

  await transaction.commit();

  const result = await Chat.findByPk(chatController.chat.id);

  // await updateCountUnreadChatsJob({ userIds: memberUserIds });
  //
  // r.server.app.broker.sendChatNotification({
  //   recipients: memberUserIds.filter((userId) => userId !== r.auth.credentials.id),
  //   action: ChatNotificationActions.groupChatCreate,
  //   data: result, // TODO lastReadMessageId: message.id
  // });

  return output(result);
}

export async function sendMessageToUser(r) {
  if (r.params.userId === r.auth.credentials.id) {
    return error(Errors.InvalidPayload, "You can't send a message to yourself", {});
  }

  await UserController.userMustExist(r.params.userId);

  const medias = await MediaController.getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  const chatController = await ChatController.findOrCreatePrivateChat(r.auth.credentials.id, r.params.userId, transaction);

  const lastMessage = await Message.findOne({
    order: [['createdAt', 'DESC']],
    where: { chatId: chatController.controller.chat.id },
  });

  const messageNumber = lastMessage ? (lastMessage.number + 1) : 1;

  const meMember = chatController.controller.chat.getDataValue('members').find(member => member.userId === r.auth.credentials.id);

  const message = await chatController.controller.createMessage(chatController.controller.chat.id, meMember.id, messageNumber, r.payload.text, transaction);

  await message.$set('medias', medias, { transaction });

  if (chatController.isCreated) {
    await chatController.controller.createChatMembersData(chatController.controller.chat.getDataValue('members'), r.auth.credentials.id, message, transaction);
    await chatController.controller.createChatData(chatController.controller.chat.id, message.id, transaction);
  } else {
    await ChatData.update({ lastMessageId: message.id }, { where: { chatId: chatController.controller.chat.id }, transaction });
  }

  await transaction.commit();

  /**TODO: refactor jobs for table ChatMemberData*/
  //if (!chatInfo.isChatCreated) {
  // await resetUnreadCountMessagesOfMemberJob({
  //   chatId: chat.id,
  //   lastReadMessageId: message.id,
  //   userId: sender.userId,
  //   lastReadMessageNumber: message.number,
  // });
  //
  // await incrementUnreadCountMessageOfMembersJob({
  //   chatId: chat.id,
  //   notifierUserId: r.auth.credentials.id,
  // });
  //}
  /**TODO: refactor jobs for table ChatMemberData*/
    // await setMessageAsReadJob({
    //   lastUnreadMessage: { id: message.id, number: message.number },
    //   chatId: chat.id,
    //   senderId: sender.id,
    // });
    //
    // await updateCountUnreadChatsJob({
    //   userIds: [r.auth.credentials.id, r.params.userId],
    // });

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
  const chat = await Chat.findByPk(r.params.chatId, {
    include: [
      {
      model: ChatData,
      as: 'chatData'
    }, {
      model: ChatMember,
      as: 'members'
    }, {
      model: ChatMember,
      as: 'meMember',
      where: { userId: r.auth.credentials.id }
    }]
  });
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  /**TODO: refactor*/
    // if (chat.type === ChatType.quest) {
    //   chatController.questChatMastHaveStatus(QuestChatStatuses.Open);
    // }

  const transaction = await r.server.app.db.transaction();

  const messageNumber = chat.chatData.lastMessage.number + 1;

  const message = await chatController.createMessage(chatController.chat.id, chatController.chat.getDataValue('meMember').id, messageNumber, r.payload.text, transaction);
  await message.$set('medias', medias, { transaction });

  await chat.chatData.update({ lastMessageId: message.id }, { transaction });

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, userId: { [Op.ne]: r.auth.credentials.id } },
  });

  const userIdsWithoutSender = membersWithoutSender.map((member) => member.userId);
  const result = await Message.findByPk(message.id);

  /** TODO: update jobs */
  // await resetUnreadCountMessagesOfMemberJob({
  //   chatId: chat.id,
  //   lastReadMessageId: message.id,
  //   userId: r.auth.credentials.id,
  //   lastReadMessageNumber: message.number,
  // });
  //
  // await incrementUnreadCountMessageOfMembersJob({
  //   chatId: chat.id,
  //   notifierUserId: r.auth.credentials.id,
  // });
  //
  // await setMessageAsReadJob({
  //   lastUnreadMessage: { id: message.id, number: message.number },
  //   chatId: r.params.chatId,
  //   senderId: sender.id,
  // });
  //
  // await updateCountUnreadChatsJob({
  //   userIds: [r.auth.credentials.id, ...userIdsWithoutSender],
  // });

  r.server.app.broker.sendChatNotification({
    action: ChatNotificationActions.newMessage,
    recipients: userIdsWithoutSender,
    data: result,
  });

  return output(result);
}

export async function removeUserFromGroupChat(r) {
  await UserController.userMustExist(r.params.userId);

  const chat = await Chat.findByPk(r.params.chatId, {
    include: [
      {
        model: ChatMember,
        as: 'members',
      },
      {
        model: ChatData,
        as: 'chatData',
      },
      {
        model: GroupChat,
        as: 'groupChat',
      },
      {
        model: ChatMember,
        as: 'meMember',
        where: { userId: r.auth.credentials.id }
      }
    ]
  });
  const chatController = new ChatController(chat);

  await chatController
    .chatMustHaveOwner(chat.getDataValue('meMember').id)
    .chatMustHaveType(ChatType.group)
    .chatMustHaveMember(r.params.userId);

  const transaction = await r.server.app.db.transaction();

  const removedChatMember = chatController.chat.members.find(member => member.userId === r.params.userId);

  const messageNumber = chat.chatData.lastMessage.number + 1;

  const message = await chatController.createInfoMessage(chat.getDataValue('meMember').id, chatController.chat.id, messageNumber, removedChatMember.id, MessageAction.groupChatDeleteUser, transaction);

  await chatController.updateChatData(chat.id, message.id, transaction);

  await chatController.createChatMemberDeletionData(removedChatMember.id, message.id, message.number, transaction);

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, userId: { [Op.ne]: r.auth.credentials.id } },
  });

  const userIdsWithoutSender = membersWithoutSender.map((member) => member.userId);

  /** TODO: refactor jobs*/
  // await resetUnreadCountMessagesOfMemberJob({
  //   chatId: chat.id,
  //   lastReadMessageId: message.id,
  //   userId: r.auth.credentials.id,
  //   lastReadMessageNumber: message.number,
  // });
  //
  // await incrementUnreadCountMessageOfMembersJob({
  //   chatId: chat.id,
  //   notifierUserId: r.auth.credentials.id,
  // });
  //
  // await updateCountUnreadChatsJob({
  //   userIds: [r.auth.credentials.id, ...userIdsWithoutSender],
  // });

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

  if (chat.groupChat.ownerMemberId === chat.getDataValue('meMember').id) {
    return error(Errors.Forbidden, 'User is chat owner', {});
  }

  await chatController
    .chatMustHaveType(ChatType.group)
    .chatMustHaveMember(r.auth.credentials.id);

  const transaction = await r.server.app.db.transaction();

  const messageNumber = chat.chatData.lastMessage.number + 1;
  const message = await chatController.createInfoMessage(chatController.chat.getDataValue('meMember').id, chatController.chat.id, messageNumber, chatController.chat.meMember.id, MessageAction.groupChatLeaveUser, transaction);

  await chatController.updateChatData(chat.id, message.id, transaction);

  await chatController.createChatMemberDeletionData(chat.getDataValue('meMember').id, message.id, message.number, transaction);

  await transaction.commit();

  const result = await Message.findByPk(message.id);
  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } },
  });
  const userIdsWithoutSender = membersWithoutSender.map((member) => member.userId);

  // /**TODO: improve jobs!*/
  // // await incrementUnreadCountMessageOfMembersJob({
  // //   chatId: groupChat.id,
  // //   notifierUserId: r.auth.credentials.id,
  // // });
  // //
  // // await updateCountUnreadChatsJob({
  // //   userIds: [r.auth.credentials.id, ...userIdsWithoutSender],
  // // });
  //
  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatLeaveUser,
  //   recipients: chat.members,//userIdsWithoutSender,
  //   data: result,
  // });

  return output(result);
}

export async function addUsersInGroupChat(r) {
  const userIds: string[] = r.payload.userIds;
  const users = await UserController.usersMustExist(userIds, 'shortWithAdditionalInfo');

  const chat = await Chat.findByPk(r.params.chatId, {
    include: [
      {
        model: ChatMember,
        as: 'members',
      },
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
    .chatMustHaveOwner(chat.getDataValue('meMember').id)
    .usersNotExistInGroupChat(userIds);

  const transaction = await r.server.app.db.transaction();

  const members = userIds.map((userId) => {
    return {
      chatId: chat.id,
      userId,
      type: MemberType.User,
    };
  });
  const newMembers = await ChatMember.bulkCreate(members, { transaction });

  const messages: Message[] = [];
  for (let i = 0; i < newMembers.length; i++) {
    const memberId = newMembers[i].id;
    const messageNumber = chat.chatData.lastMessage.number + 1;

    const message = await chatController.createInfoMessage(chatController.chat.meMember.id, chatController.chat.id, messageNumber, memberId, MessageAction.groupChatAddUser, transaction);

    messages.push(message);
  }

  const lastMessage = messages[messages.length - 1];
  await chatController.createChatMembersData(chatController.chat.members, r.auth.credentials.id, lastMessage, transaction);

  await chat.chatData.update({ lastMessageId: lastMessage.id }, { transaction } );

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, userId: { [Op.ne]: r.auth.credentials.id } },
  });

  const userIdsInChatWithoutSender = membersWithoutSender.map((member) => member.userId);

  // messagesResult = messagesResult.map((message) => {
  //   const keysMessage: { [key: string]: any } = message.toJSON();
  //   const keysInfoMessage = infoMessagesResult.find((_) => _.messageId === message.id).toJSON() as InfoMessage;
  //
  //   keysInfoMessage.member = users.find((_) => _.id === keysInfoMessage.memberId).toJSON() as ChatMember;
  //
  //   keysMessage.infoMessage = keysInfoMessage;
  //
  //   return keysMessage;
  // }) as Message[];

  // await resetUnreadCountMessagesOfMemberJob({
  //   chatId: groupChat.id,
  //   lastReadMessageId: lastMessage.id,
  //   userId: r.auth.credentials.id,
  //   lastReadMessageNumber: lastMessage.number,
  // });
  //
  // await incrementUnreadCountMessageOfMembersJob({
  //   chatId: groupChat.id,
  //   notifierUserId: r.auth.credentials.id,
  // });
  //
  // await updateCountUnreadChatsJob({
  //   userIds: [r.auth.credentials.id, ...userIdsInChatWithoutSender],
  // });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatAddUser,
  //   recipients: userIdsInChatWithoutSender,
  //   data: messagesResult,
  // });
  //
  // return output(messagesResult);
}

export async function setMessagesAsRead(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(chat);

  const sender = await ChatMember.findOne({ where: { chatId: chat.id, userId: r.auth.credentials.id } });

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const message = await Message.findByPk(r.payload.messageId);

  if (!message) {
    return error(Errors.NotFound, 'Message is not found', {});
  }

  const otherSenders = await Message.unscoped().findAll({
    attributes: ['senderMemberId'],
    where: {
      chatId: chatController.chat.id,
      senderMemberId: { [Op.ne]: sender.id },
      senderStatus: SenderMessageStatus.unread,
      number: { [Op.gte]: message.number },
    },
    group: ['senderMemberId'],
  });

  // await updateCountUnreadMessagesJob({
  //   lastUnreadMessage: { id: message.id, number: message.number },
  //   chatId: chat.id,
  //   readerUserId: r.auth.credentials.id,
  // });

  if (otherSenders.length === 0) {
    return output();
  }

  // await setMessageAsReadJob({
  //   lastUnreadMessage: { id: message.id, number: message.number },
  //   chatId: r.params.chatId,
  //   senderId: sender.id,
  // });
  //
  // await updateCountUnreadChatsJob({
  //   userIds: [r.auth.credentials.id],
  // });

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
