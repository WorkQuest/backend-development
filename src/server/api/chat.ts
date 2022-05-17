import { literal, Op } from 'sequelize';
import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { setMessageAsReadJob } from '../jobs/setMessageAsRead';
import { ChatNotificationActions } from '../controllers/controller.broker';
import { updateCountUnreadChatsJob } from '../jobs/updateCountUnreadChats';
import { updateCountUnreadMessagesJob } from '../jobs/updateCountUnreadMessages';
import { listOfUsersByChatsCountQuery, listOfUsersByChatsQuery } from '../queries';
import { resetUnreadCountMessagesOfMemberJob } from '../jobs/resetUnreadCountMessagesOfMember';
import { incrementUnreadCountMessageOfMembersJob } from '../jobs/incrementUnreadCountMessageOfMembers';
import {
  Chat,
  User,
  ChatData,
  Message,
  QuestChat,
  ChatMember,
  StarredChat,
  StarredMessage,
  SenderMessageStatus,
  ChatMemberDeletionData,
} from '@workquest/database-models/lib/models';
import {
  GetChatByIdHandler,
  GetGroupChatHandler,
  GetUsersByIdHandler,
  GetUsersByIdsHandler,
  GetMediaByIdsHandler,
  SendMessageToChatHandler,
  SendMessageToUserHandler,
  GetChatMemberByIdHandler,
  LeaveFromGroupChatHandler,
  GetChatMemberByUserHandler,
  AddUsersInGroupChatHandler,
  GetMediasPostValidationHandler,
  GetChatByIdPostValidationHandler,
  GetUsersByIdPostValidationHandler,
  DeletedMemberFromGroupChatHandler,
  GetChatMemberPostValidationHandler,
  GetUsersByIdsPostValidationHandler,
  LeaveFromGroupChatPreValidateHandler,
  AddUsersInGroupChatPreValidateHandler,
  GetUsersByIdPostAccessPermissionHandler,
  GetChatMemberPostAccessPermissionHandler,
  GetUsersByIdsPostAccessPermissionHandler,
  LeaveFromGroupChatPreAccessPermissionHandler,
  DeletedMemberFromGroupChatPreValidateHandler,
  AddUsersInGroupChatPreAccessPermissionHandler,
  DeletedMemberFromGroupChatPreAccessPermissionHandler,
} from '../handlers';

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
  const chatName: string = r.payload.name;
  const userIds: string[] = r.payload.userIds;

  if (!userIds.includes(r.auth.credentials.id)) {
    userIds.push(r.auth.credentials.id);
  }

  // r.server.app.broker.sendChatNotification({
  //   recipients: userMemberIds.filter((id) => id !== userChatOwner.id),
  //   action: ChatNotificationActions.groupChatCreate,
  //   data: chatDto,
  // });

  // return output(chatDto);
}

export async function sendMessageToUser(r) {
  const meUser: User = r.auth.credentials;

  const { userId } = r.params as { userId: string };
  const { text, mediaIds } = r.payload as { text: string, mediaIds: string[] }

  const recipientUser = await new GetUsersByIdPostAccessPermissionHandler(
    new GetUsersByIdPostValidationHandler(
      new GetUsersByIdHandler()
    )
  ).Handle({ userId });

  const medias = await new GetMediasPostValidationHandler(
    new GetMediaByIdsHandler()
  ).Handle({ mediaIds });

  const message = await new SendMessageToUserHandler(r.server.app.db).Handle({
    text,
    medias,
    sender: meUser,
    recipient: recipientUser,
  });

  // await incrementUnreadCountMessageOfMembersJob({
  //   chatId: privateChatController.chat.id,
  //   skipMemberIds: [privateChatController.members.senderMember.id],
  // });
  // await setMessageAsReadJob({
  //   chatId: privateChatController.chat.id,
  //   lastUnreadMessage: { id: message.id, number: message.number },
  //   senderMemberId: privateChatController.members.senderMember.id,
  // });
  // await updateCountUnreadChatsJob({
  //   members: [privateChatController.members.senderMember, privateChatController.members.recipientMember],
  // });

  // r.server.app.broker.sendChatNotification({
  //   data: message,
  //   action: ChatNotificationActions.newMessage,
  //   recipients: [privateChatController.members.recipientMember.userId],
  // });

  return output(message);
}

export async function sendMessageToChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };
  const { text, mediaIds } = r.payload as { text: string, mediaIds: string[] };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ user: meUser, chat });

  const medias = await new GetMediasPostValidationHandler(
    new GetMediaByIdsHandler()
  ).Handle({ mediaIds });

  await new SendMessageToChatHandler(r.server.app.db).Handle({
    chat,
    text,
    medias,
    sender: meMember,
  })

  // await resetUnreadCountMessagesOfMemberJob({
  //   memberId: senderMember.id,
  //   chatId: chatController.chat.id,
  //   lastReadMessage: { id: message.id, number: message.number },
  // });
  // await incrementUnreadCountMessageOfMembersJob({
  //   chatId: chatController.chat.id,
  //   skipMemberIds: [senderMember.id],
  // });
  // await setMessageAsReadJob({
  //   chatId: r.params.chatId,
  //   senderMemberId: chatController.chat.meMember.id,
  //   lastUnreadMessage: { id: message.id, number: message.number },
  // });
  // await updateCountUnreadChatsJob({
  //   members: members,
  // });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.newMessage,
  //   recipients: ,
  //   data: message,
  // });

  // return output(message);
}

export async function removeMemberFromGroupChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId, memberId } = r.params as { chatId: string, memberId: string };

  const groupChat = await new GetGroupChatPostValidationHandler(
    new GetGroupChatHandler()
  ).Handle({ chatId });

  const member = await new GetChatMemberPostAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByIdHandler()
    )
  ).Handle({ chat: groupChat, id: memberId });

  const meMember = await new GetChatMemberPostAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ chat: groupChat, user: meUser });

  const messageWithInfo = await new DeletedMemberFromGroupChatPreAccessPermissionHandler(
    new DeletedMemberFromGroupChatPreValidateHandler(
      new DeletedMemberFromGroupChatHandler(r.server.app.db)
    )
  ).Handle({ member, groupChat, deletionInitiator: meMember });

  // await resetUnreadCountMessagesOfMemberJob({
  //   memberId: meMember.id,
  //   chatId: groupChat.id,
  //   lastReadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  // });
  // await incrementUnreadCountMessageOfMembersJob({
  //   skipMemberIds: [meMember.id],
  //   chatId: groupChat.id,
  // });
  // await setMessageAsReadJob({
  //   senderMemberId: meMember.id,
  //   chatId: groupChat.id,
  //   lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  // });
  // await updateCountUnreadChatsJob({
  //   chatId: groupChat.id,
  //   skipMembersIds: [meMember.id],
  // });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatDeleteUser,
  //   recipients: userIdsWithoutSender,
  //   data: message,
  // });

  return output(messageWithInfo);
}

export async function leaveFromGroupChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  const groupChat = await new GetGroupChatPostValidationHandler(
    new GetGroupChatHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ chat: groupChat, user: meUser });

  const messageWithInfo = await new LeaveFromGroupChatPreValidateHandler(
    new LeaveFromGroupChatPreAccessPermissionHandler(
      new LeaveFromGroupChatHandler(r.server.app.db)
    )
  ).Handle({ member: meMember, groupChat });

  // await incrementUnreadCountMessageOfMembersJob({
  //   chatId: groupChatService.getChat().id,
  //   skipMemberIds: [meMember.id],
  // });
  // await setMessageAsReadJob({
  //   chatId: groupChatService.getChat().id,
  //   senderMemberId: meMember.id,
  //   lastUnreadMessage: { id: infoMessage.id, number: infoMessage.number },
  // });
  // await updateCountUnreadChatsJob({
  //   userIds: members
  //     .filter(m => m.type == MemberType.User)
  //     .map(m => m.userId),
  //   adminIds: members
  //     .filter(m => m.type == MemberType.Admin)
  //     .map(m => m.adminId),
  // });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatLeaveUser,
  //   recipients: group-chat.members,//userIdsWithoutSender,
  //   data: result,
  // });

  return output(messageWithInfo);
}

export async function addUsersInGroupChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };
  const { userIds } = r.payload as { userIds: string[] };

  const groupChat = await new GetGroupChatPostValidationHandler(
    new GetGroupChatHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostAccessPermissionHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ chat: groupChat, user: meUser });

  const users = await new GetUsersByIdsPostValidationHandler(
    new GetUsersByIdsPostAccessPermissionHandler(
      new GetUsersByIdsHandler()
    )
  ).Handle({ userIds });

  const messagesWithInfo = await new AddUsersInGroupChatPreValidateHandler(
    new AddUsersInGroupChatPreAccessPermissionHandler(
      new AddUsersInGroupChatHandler(r.server.app.db)
    )
  ).Handle({ groupChat, users, addInitiator: meMember })

  // await resetUnreadCountMessagesOfMemberJob({
  //   memberId: meMember.id,
  //   chatId: groupChatService.getChat().id,
  //   lastReadMessage: { id: lastMessage.id, number: lastMessage.number },
  // });
  // await incrementUnreadCountMessageOfMembersJob({
  //   chatId: group-chat.id,
  //   notifierMemberId: chatController.group-chat.meMember.id,
  //   withoutMemberIds: newMembersIds,
  // });
  // await updateCountUnreadChatsJob({
  //   userIds: [r.auth.credentials.id, ...userIdsInChatWithoutSender],
  // });
  //
  // await setMessageAsReadJob({
  //   lastUnreadMessage: { id: lastMessage.id, number: lastMessage.number },
  //   chatId: r.params.chatId,
  //   senderMemberId: group-chat.meMember.id,
  // });
  //
  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatAddUser,
  //   recipients: userIdsInChatWithoutSender,
  //   data: messagesResult,
  // });
  //
  return output(messagesWithInfo);
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
  //await group-chat.mustHaveMember(r.auth.credentials.id);

  await StarredChat.destroy({
    where: {
      chatId: r.params.chatId,
      userId: r.auth.credentials.id,
    },
  });

  return output();
}
