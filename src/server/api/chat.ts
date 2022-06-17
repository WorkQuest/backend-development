import { literal, Op } from "sequelize";
import { output } from "../utils";
import { updateChatDataJob } from "../jobs/updateChatData";
import { setMessageAsReadJob } from "../jobs/setMessageAsRead";
import { ChatNotificationActions } from "../controllers/controller.broker";
import { updateCountUnreadChatsJob } from "../jobs/updateCountUnreadChats";
import { updateCountUnreadMessagesJob } from "../jobs/updateCountUnreadMessages";
import { listOfUsersByChatsCountQuery, listOfUsersByChatsQuery } from "../queries";
import { resetUnreadCountMessagesOfMemberJob } from "../jobs/resetUnreadCountMessagesOfMember";
import { incrementUnreadCountMessageOfMembersJob } from "../jobs/incrementUnreadCountMessageOfMembers";
import {
  Admin,
  Chat,
  ChatData,
  ChatMember,
  ChatMemberData,
  ChatMemberDeletionData,
  ChatType,
  GroupChat,
  InfoMessage,
  Media,
  MemberStatus, MemberType,
  Message,
  Quest,
  QuestChat,
  QuestChatStatus,
  SenderMessageStatus,
  StarredChat,
  StarredMessage,
  User
} from '@workquest/database-models/lib/models';
import {
  AddUsersInGroupChatHandler,
  AddUsersInGroupChatPreAccessPermissionHandler,
  AddUsersInGroupChatPreValidateHandler,
  CreateGroupChatHandler,
  DeletedMemberFromGroupChatHandler,
  DeletedMemberFromGroupChatPreAccessPermissionHandler,
  DeletedMemberFromGroupChatPreValidateHandler,
  GetChatByIdHandler,
  GetChatByIdPostValidationHandler,
  GetChatMemberByIdHandler,
  GetChatMemberByUserHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  GetChatMemberPostLimitedAccessPermissionHandler,
  GetChatMemberPostValidationHandler,
  GetChatMessageByIdHandler,
  GetChatMessageByIdPostValidatorHandler,
  GetGroupChatHandler,
  GetGroupChatPostValidationHandler,
  GetMediaByIdsHandler,
  GetMediasPostValidationHandler,
  GetUserByIdHandler,
  GetUserByIdPostAccessPermissionHandler,
  GetUserByIdPostValidationHandler,
  GetUsersByIdsHandler,
  GetUsersByIdsPostAccessPermissionHandler,
  GetUsersByIdsPostValidationHandler,
  LeaveFromGroupChatHandler,
  LeaveFromGroupChatPreAccessPermissionHandler,
  LeaveFromGroupChatPreValidateHandler,
  MarkChatStarHandler,
  RemoveStarFromChatHandler,
  RemoveStarFromMessageHandler,
  SendMessageToChatHandler,
  SendMessageToUserHandler,
  UserMarkMessageStarHandler
} from "../handlers";

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
  const searchByGroupNameLiteral = literal(
    `(SELECT "name" FROM "GroupChats" WHERE "id" = ` +
    `(SELECT "id" FROM "GroupChats" WHERE "chatId" = "Chat"."id")) ` +
    ` ILIKE :query`,
  );
  const orderByMessageDateLiteral = literal(
    '(CASE WHEN EXISTS (SELECT "Messages"."createdAt" FROM "ChatMemberDeletionData" INNER JOIN "Messages" ON "beforeDeletionMessageId" = "Messages"."id" ' +
    'INNER JOIN "ChatMembers" ON "ChatMemberDeletionData"."beforeDeletionMessageId" = "ChatMembers"."id" WHERE "ChatMembers"."chatId" = "Chat"."id") ' +
    'THEN (SELECT "Messages"."createdAt" FROM "ChatMemberDeletionData" INNER JOIN "Messages" ON "beforeDeletionMessageId" = "Messages"."id" INNER JOIN "ChatMembers" ON ' +
    ' "ChatMemberDeletionData"."beforeDeletionMessageId" = "ChatMembers"."id" WHERE "ChatMembers"."chatId" = "Chat"."id") ' +
    'ELSE (SELECT "Messages"."createdAt" FROM "ChatData" INNER JOIN "Messages" ON "lastMessageId" = "Messages"."id" WHERE "ChatData"."chatId" = "Chat"."id") END)'
  );
  const chatTypeLiteral = literal(
    `("Chat"."type" = '${ ChatType.Private }' OR "Chat"."type" = '${ ChatType.Quest }')`
  )

  const where = {
    ...(r.query.type && { type: r.query.type }),
  };

  const replacements = {};

  const include: any[] = [{
    model: ChatMember,
    where: { userId: r.auth.credentials.id },
    include: [{
      model: ChatMemberDeletionData,
      as: 'chatMemberDeletionData',
      include: [{
        model: Message.unscoped(),
        as: 'beforeDeletionMessage'
      }]
    }, {
    model: User.unscoped(),
    as: 'user',
    attributes: ["id", "avatarId", "firstName", "lastName"],
    include: [{
      model: Media,
      as: 'avatar',
    }],
  }, {
    model: ChatMemberData,
    attributes: ["lastReadMessageId", "unreadCountMessages", "lastReadMessageNumber"],
    as: 'chatMemberData',
  }],
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
      as: 'lastMessage',
      include: [{
        model: ChatMember,
        as: 'sender',
        include: [{
          model: User.unscoped(),
          as: 'user',
          attributes: ["id", "firstName", "lastName"]
        }],
      }, {
        model: InfoMessage,
        as: 'infoMessage'
      }],
    }],
  }, {
    model: ChatMember,
    as: 'members',
    where: { [Op.and]: [ { [Op.or]: [{ adminId: { [Op.ne]: r.auth.credentials.id } }, { userId: { [Op.ne]: r.auth.credentials.id } }] }, chatTypeLiteral ] },
    include: [{
      model: User.unscoped(),
      as: 'user',
      attributes: ["id", "firstName", "lastName"],
      include: [{
        model: Media,
        as: 'avatar'
      }]
    }, {
      model: Admin.unscoped(),
      as: 'admin',
      attributes: ["id", "firstName", "lastName"],
    }, {
      model: ChatMemberData,
      attributes: ["lastReadMessageId", "unreadCountMessages", "lastReadMessageNumber"],
      as: 'chatMemberData'
    }],
    required: false,
  }, {
    model: QuestChat,
    as: 'questChat',
    include: {
      model: Quest.unscoped(),
      as: 'quest',
      attributes: ["id", "title"],
    }
  }, {
    model: GroupChat,
    as: 'groupChat',
  }];

  if ((r.query.questChatStatus && r.query.questChatStatus === QuestChatStatus.Open) &&
    (r.query.type && r.query.type === ChatType.Quest)) {
    include.push({
      model: QuestChat,
      as: 'questChat',
      where: {
        status: r.query.questChatStatus,
      },
    });
  }

  if (r.query.q) {
    where[Op.or] = [];

    where[Op.or].push(searchByQuestNameLiteral, searchByFirstAndLastNameLiteral, searchByGroupNameLiteral);

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
    ...(meMember.chatMemberDeletionData && { createdAt: { [Op.lte]: meMember.chatMemberDeletionData.beforeDeletionMessage.createdAt } }),
  }

  const include = [{
    model: StarredMessage,
    as: 'star',
    where: { userId: meMember.userId },
    required: r.query.starred,
  }, {
    model: ChatMember,
    as: 'sender',
    include: [{
      model: User.unscoped(),
      as: 'user',
      attributes: ["id", "avatarId", "firstName", "lastName"],
      include: [{
        model: Media,
        as: 'avatar',
      }],
    }, {
      model: ChatMemberData,
      attributes: ["lastReadMessageId", "unreadCountMessages", "lastReadMessageNumber"],
      as: 'chatMemberData',
    }],
  }, {
    model: Media,
    as: 'medias',
  }, {
    model: InfoMessage.unscoped(),
    attributes: ["messageId", "messageAction"],
    as: 'infoMessage'
  }];

  const { count, rows } = await Message.findAndCountAll({
    where,
    include,
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', r.query.sort.createdAt]]
  });

  return output({ count, messages: rows, chat });
}

export async function getUserChat(r) {
  const { chatId } = r.params as { chatId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

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

  await updateChatDataJob({
    chatId: chat.id,
    lastMessageId: messageWithInfo.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
    chatId: chat.id,
    readerMemberId: chat.getDataValue('groupChat').ownerMemberId,
  });

  await setMessageAsReadJob({
    chatId: messageWithInfo.chatId,
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
    senderMemberId: chat.getDataValue('groupChat').ownerMemberId,
  });

  const members: ChatMember[] = chat.getDataValue('members');

  await updateCountUnreadChatsJob({
    members,
  });

  r.server.app.broker.sendChatNotification({
    recipients: members.map(member => member.userId || member.adminId).filter(id => chatCreator.id !== id),
    action: ChatNotificationActions.groupChatCreate,
    data: messageWithInfo.toJSON(),
  });

  return output({ chat, infoMessage: messageWithInfo });
}

export async function sendMessageToUser(r) {
  const meUser: User = r.auth.credentials;

  const { userId } = r.params as { userId: string };
  const { text, mediaIds } = r.payload as { text: string, mediaIds: string[] }

  const recipientUser = await new GetUserByIdPostAccessPermissionHandler(
    new GetUserByIdPostValidationHandler(
      new GetUserByIdHandler()
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

  const recipientMember = await ChatMember.findOne({
    where: {
      userId: recipientUser.id,
      chatId: message.getDataValue('chat').id
    }
  });

  await updateChatDataJob({
    chatId: message.getDataValue('chat').id,
    lastMessageId: message.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: message.chatId,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    chatId: message.chatId,
    lastUnreadMessage: { id: message.id, number: message.number },
    senderMemberId: meMember.id,
  });

  //TODO
  await updateCountUnreadChatsJob({
    members: [meMember, recipientMember],
  });

  r.server.app.broker.sendChatNotification({
    data: message,
    recipients: [userId],
    action: ChatNotificationActions.newMessage,
  });

  return output(message);
}

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
    chatId,
    lastReadMessage: { id: message.id, number: message.number },
  });
  await incrementUnreadCountMessageOfMembersJob({
    chatId,
    skipMemberIds: [meMember.id],
  });

  await updateChatDataJob({
    chatId,
    lastMessageId: message.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    chatId,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: message.id, number: message.number },
  });

  await updateCountUnreadChatsJob({
    members: chat.getDataValue('members'),
  });

  const members = await ChatMember.findAll({
    attributes: ['userId', 'adminId'],
    where: {
      [Op.or]: {
        [Op.and]: {
          type: MemberType.User,
          userId: { [Op.ne]: meUser.id }
        },
        type: MemberType.Admin
      },
      status: MemberStatus.Active,
      chatId
    }
  });

  r.server.app.broker.sendChatNotification({
    data: message.toJSON(),
    action: ChatNotificationActions.newMessage,
    recipients: members.map(({ userId, adminId}) => userId || adminId),
  });

  return output(message);
}

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

  await updateChatDataJob({
    chatId: groupChat.id,
    lastMessageId: messageWithInfo.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
    chatId: messageWithInfo.chatId,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    senderMemberId: meMember.id,
    chatId: groupChat.id,
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  });

  //TODO: переделать
  const members = await ChatMember.findAll({
    where: {
      chatId,
      status: MemberStatus.Active,
    }
  });

  await updateCountUnreadChatsJob({ members });

  r.server.app.broker.sendChatNotification({
    data: messageWithInfo.toJSON(),
    action: ChatNotificationActions.groupChatDeleteUser,
    recipients: members.map(({ userId, adminId }) => userId ||adminId).filter(id => meUser.id !== id),
  });

  return output(messageWithInfo);
}

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

  await updateChatDataJob({
    chatId: groupChat.id,
    lastMessageId: messageWithInfo.id,
  });

  await setMessageAsReadJob({
    chatId: groupChat.id,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  });

  //TODO: переделать
  const members = await ChatMember.findAll({
    where: {
      chatId,
      status: MemberStatus.Active,
    }
  });

  await updateCountUnreadChatsJob({ members });

  r.server.app.broker.sendChatNotification({
    data: messageWithInfo.toJSON(),
    action: ChatNotificationActions.groupChatLeaveUser,
    recipients: members.map(({ userId, adminId }) => userId ||adminId),
  });

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

  await updateChatDataJob({
    chatId: groupChat.id,
    lastMessageId: lastMessage.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: lastMessage.id, number: lastMessage.number },
    chatId: groupChat.id,
    readerMemberId: meMember.id,
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

  await updateCountUnreadChatsJob({
    members,
  });

  r.server.app.broker.sendChatNotification({
    data: lastMessage.toJSON(),
    action: ChatNotificationActions.groupChatAddUser,
    recipients: members.map(({ userId, adminId }) => userId ||adminId).filter(id => meUser.id !== id),
  });

  return output(messagesWithInfo);
}

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
    readerMemberId: meMember.id,
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
      {
        model: ChatMember,
        as: 'sender',
        include: [{
          model: User.unscoped(),
          as: 'user',
          attributes: ["id", "avatarId", "firstName", "lastName"],
          include: [{
            model: Media,
            as: 'avatar',
          }],
        }],
      },
      {
        model: Media,
        as: 'medias'
      }
    ],
  });

  return output({ count, messages: rows });
}

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

export async function removeStarFromMessage(r) {
  const meUser: User = r.auth.credentials;

  const { messageId } = r.params as { messageId: string };

  await new RemoveStarFromMessageHandler().Handle({ user: meUser, messageId });

  return output();
}

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

export async function removeStarFromChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  await new RemoveStarFromChatHandler().Handle({ user: meUser, chatId });

  return output();
}
