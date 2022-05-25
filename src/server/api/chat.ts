import { literal, Op } from 'sequelize';
import { output } from '../utils';
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
  Admin,
  ChatData,
  Message,
  QuestChat,
  ChatMember,
  StarredChat,
  MemberStatus,
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
  MarkChatStarHandler,
  SendMessageToChatHandler,
  SendMessageToUserHandler,
  GetChatMemberByIdHandler,
  RemoveStarFromChatHandler,
  LeaveFromGroupChatHandler,
  GetChatMemberByUserHandler,
  UserMarkMessageStarHandler,
  AddUsersInGroupChatHandler,
  GetChatMessageByIdHandler,
  RemoveStarFromMessageHandler,
  GetMediasPostValidationHandler,
  GetChatByIdPostValidationHandler,
  GetUsersByIdPostValidationHandler,
  GetGroupChatPostValidationHandler,
  DeletedMemberFromGroupChatHandler,
  GetChatMemberPostValidationHandler,
  GetUsersByIdsPostValidationHandler,
  LeaveFromGroupChatPreValidateHandler,
  AddUsersInGroupChatPreValidateHandler,
  GetChatMessageByIdPostValidatorHandler,
  GetUsersByIdPostAccessPermissionHandler,
  GetUsersByIdsPostAccessPermissionHandler,
  LeaveFromGroupChatPreAccessPermissionHandler,
  DeletedMemberFromGroupChatPreValidateHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  AddUsersInGroupChatPreAccessPermissionHandler,
  GetChatMemberPostLimitedAccessPermissionHandler,
  DeletedMemberFromGroupChatPreAccessPermissionHandler, CreateGroupChatHandler
} from "../handlers";

export const searchChatFields = ['name'];

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
  const { chatId } = r.params as { chatId: string };
  const meUser = r.auth.credentials;

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostLimitedAccessPermissionHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ chat, user: meUser });

  const where = {
    chatId: chat.id,
    ...(meMember.chatMemberDeletionData && { createdAt: {[Op.lte]: meMember.chatMemberDeletionData.beforeDeletionMessage.createdAt }})
  }

  const { count, rows } = await Message.findAndCountAll({
    where,
    include: [
      {
        model: StarredMessage,
        as: 'star',
        where: { userId: meMember.userId },
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
  const { chatId } = r.params as { chatId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  // const chat = await Chat.findByPk(r.params.chatId, {
  //   include: [{
  //     model: StarredChat,
  //     as: 'star',
  //     required: false,
  //   }, {
  //     model: QuestChat,
  //     as: 'questChat',
  //     required: false,
  //   }],
  // });
  // const chatController = new ChatController(chat);
  //
  // await chatController.chatMustHaveMember(r.auth.credentials.id);
  //
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
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ user: meUser, chat });

  const { count, rows } = await ChatMember.unscoped().findAndCountAll({
    distinct: true,
    include: [{
      model: User.scope('shortWithAdditionalInfo'),
      as: 'user',
    }, {
      model: Admin.scope('short'),
      as: 'admin',
    }],
    where: {
      chatId: chat.id,
      status: MemberStatus.Active,
    },
  });

  return output({ count, members: rows });
}
//TODO updateCountUnreadChatsJob
export async function createGroupChat(r) {
  const chatName: string = r.payload.name;
  const chatCreator: User = r.auth.credentials;
  const userIds: string[] = r.payload.userIds;

  const invitedUsers: User[] = await new GetUsersByIdsPostValidationHandler(
    new GetUsersByIdsPostAccessPermissionHandler(
      new GetUsersByIdsHandler()
    )
  ).Handle({ userIds });

  const [chat, messageWithInfo] = await new CreateGroupChatHandler(r.server.app.db).Handle({
    chatName,
    chatCreator,
    invitedUsers,
  });

  await updateCountUnreadChatsJob({
    //chatId: message.chatId,
    userIds: [...userIds, chatCreator.id],
  });

  // r.server.app.broker.sendChatNotification({
  //   recipients: userMemberIds.filter((id) => id !== userChatOwner.id),
  //   action: ChatNotificationActions.groupChatCreate,
  //   data: chatDto,
  // });

  return output(chat);
}
//TODO updateCountUnreadChatsJob
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

  const meMember = await new GetChatMemberByUserHandler().Handle({ user: meUser, chat: message.getDataValue('chat') });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: message.chatId,
    skipMemberIds: [meMember.id],
  });
  await setMessageAsReadJob({
    chatId: message.chatId,
    lastUnreadMessage: { id: message.id, number: message.number },
    senderMemberId: meMember.id,
  });

  //TODO
  await updateCountUnreadChatsJob({
    //chatId: message.chatId,
    userIds: [userId, meUser.id],
  });

  // r.server.app.broker.sendChatNotification({
  //   data: message,
  //   action: ChatNotificationActions.newMessage,
  //   recipients: [privateChatController.members.recipientMember.userId],
  // });

  return output(message);
}
//TODO updateCountUnreadChatsJob
export async function sendMessageToChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };
  const { text, mediaIds } = r.payload as { text: string, mediaIds: string[] };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ user: meUser, chat });

  const medias = await new GetMediasPostValidationHandler(
    new GetMediaByIdsHandler()
  ).Handle({ mediaIds });

  const message = await new SendMessageToChatHandler(r.server.app.db).Handle({
    chat,
    text,
    medias,
    sender: meMember,
  });

  await resetUnreadCountMessagesOfMemberJob({
    memberId: meMember.id,
    chatId: chat.id,
    lastReadMessage: { id: message.id, number: message.number },
  });
  await incrementUnreadCountMessageOfMembersJob({
    chatId: chat.id,
    skipMemberIds: [meMember.id],
  });
  await setMessageAsReadJob({
    chatId: r.params.chatId,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: message.id, number: message.number },
  });

  //TODO: переделать
  const members = await ChatMember.findAll({ where: {
    chatId,
    status: MemberStatus.Active,
    }
  });
  const userIds = members.map(member => { return member.userId });

  await updateCountUnreadChatsJob({ userIds });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.newMessage,
  //   recipients: ,
  //   data: message,
  // });

  return output(message);
}
//TODO updateCountUnreadChatsJob
export async function removeMemberFromGroupChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId, userId } = r.params as { chatId: string, userId: string };

  const groupChat = await new GetGroupChatPostValidationHandler(
    new GetGroupChatHandler()
  ).Handle({ chatId });

  const member = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByIdHandler()
    )
  ).Handle({ chat: groupChat, id: userId });

  const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ chat: groupChat, user: meUser });

  const messageWithInfo = await new DeletedMemberFromGroupChatPreAccessPermissionHandler(
    new DeletedMemberFromGroupChatPreValidateHandler(
      new DeletedMemberFromGroupChatHandler(r.server.app.db)
    )
  ).Handle({ member, groupChat, deletionInitiator: meMember });

  await resetUnreadCountMessagesOfMemberJob({
    chatId: groupChat.id,
    memberId: meMember.id,
    lastReadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  });
  await incrementUnreadCountMessageOfMembersJob({
    skipMemberIds: [meMember.id],
    chatId: groupChat.id,
  });
  await setMessageAsReadJob({
    senderMemberId: meMember.id,
    chatId: groupChat.id,
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  });

  //TODO: переделать
  const members = await ChatMember.findAll({ where: {
      chatId,
      status: MemberStatus.Active,
    }
  });
  const userIds = members.map(member => { return member.userId });

  await updateCountUnreadChatsJob({ userIds });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatDeleteUser,
  //   recipients: userIdsWithoutSender,
  //   data: message,
  // });

  return output(messageWithInfo);
}
//TODO updateCountUnreadChatsJob
export async function leaveFromGroupChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  const groupChat = await new GetGroupChatPostValidationHandler(
    new GetGroupChatHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ chat: groupChat, user: meUser });

  const messageWithInfo = await new LeaveFromGroupChatPreValidateHandler(
    new LeaveFromGroupChatPreAccessPermissionHandler(
      new LeaveFromGroupChatHandler(r.server.app.db)
    )
  ).Handle({ member: meMember, groupChat });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: groupChat.id,
    skipMemberIds: [meMember.id],
  });
  await setMessageAsReadJob({
    chatId: groupChat.id,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  });

  //TODO: переделать
  const members = await ChatMember.findAll({ where: {
      chatId,
      status: MemberStatus.Active,
    }
  });
  const userIds = members.map(member => { return member.userId });

  await updateCountUnreadChatsJob({ userIds });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatLeaveUser,
  //   recipients: group-chat.members,//userIdsWithoutSender,
  //   data: result,
  // });

  return output(messageWithInfo);
}
//TODO updateCountUnreadChatsJob
export async function addUsersInGroupChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };
  const { userIds } = r.payload as { userIds: string[] };

  const groupChat = await new GetGroupChatPostValidationHandler(
    new GetGroupChatHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostFullAccessPermissionHandler(
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

  const lastMessage = messagesWithInfo[messagesWithInfo.length - 1];

  await resetUnreadCountMessagesOfMemberJob({
    chatId: groupChat.id,
    memberId: meMember.id,
    lastReadMessage: { id: lastMessage.id, number: lastMessage.number },
  });
  await incrementUnreadCountMessageOfMembersJob({
    chatId: groupChat.id,
    skipMemberIds: [meMember.id],
  });

  await setMessageAsReadJob({
    chatId: groupChat.id,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: lastMessage.id, number: lastMessage.number }
  });

  //TODO: переделать
  const members = await ChatMember.findAll({ where: {
      chatId,
      status: MemberStatus.Active,
    }
  });
  const memberUserIds = members.map(member => { return member.userId });

  await updateCountUnreadChatsJob({
    userIds: memberUserIds,
  });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatAddUser,
  //   recipients: userIdsInChatWithoutSender,
  //   data: messagesResult,
  // });

  return output(messagesWithInfo);
}
//сheck updateCountUnreadMessagesJob
export async function setMessagesAsRead(r) {
  const meUser: User = r.auth.credentials
  const { chatId } = r.params as { chatId: string };
  const { messageId } = r.payload as { messageId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostLimitedAccessPermissionHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ chat, user: meUser });

  const message = await new GetChatMessageByIdPostValidatorHandler(
    new GetChatMessageByIdHandler()
  ).Handle({ messageId, chat });

  const otherSenders = await Message.unscoped().findAll({
    attributes: ['senderMemberId'],
    where: {
      chatId: chat.id,
      senderMemberId: { [Op.ne]: meMember.id },
      senderStatus: SenderMessageStatus.Unread,
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
    senderMemberId: meMember.id,
  });
  // await updateCountUnreadChatsJob({
  //   userIds: [r.auth.credentials.id],
  // });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.messageReadByRecipient,
  //   recipients: otherSenders.map((sender) => sender.senderMemberId),
  //   data: message,
  // });

  return output();
}
//check
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
//check
export async function markMessageStar(r) {
  const meUser: User = r.auth.credentials;

  const { chatId, messageId } = r.params as { chatId: string, messageId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostLimitedAccessPermissionHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ chat, user: meUser });

  const message = await new GetChatMessageByIdPostValidatorHandler(
    new GetChatMessageByIdHandler()
  ).Handle({ messageId, chat });

  await new UserMarkMessageStarHandler().Handle({ user: meUser, message });

  return output();
}
//check
export async function removeStarFromMessage(r) {
  const meUser: User = r.auth.credentials;

  const { messageId } = r.params as { messageId: string };

  await new RemoveStarFromMessageHandler().Handle({ user: meUser, messageId });

  return output();
}
//check
export async function markChatStar(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostLimitedAccessPermissionHandler(
      new GetChatMemberByUserHandler()
    )
  ).Handle({ chat, user: meUser });

  await new MarkChatStarHandler().Handle({ chat, user: meUser });

  return output();
}
//check
export async function removeStarFromChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  await new RemoveStarFromChatHandler().Handle({ user: meUser, chatId });

  return output();
}
