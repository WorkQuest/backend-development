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
  User,
  Chat,
  Admin,
  Media,
  Quest,
  Message,
  ChatData,
  ChatType,
  QuestChat,
  GroupChat,
  ChatMember,
  MemberType,
  InfoMessage,
  StarredChat,
  MemberStatus,
  ChatMemberData,
  QuestsResponse,
  StarredMessage,
  QuestChatStatus,
  ChatDeletionData,
  QuestsResponseStatus,
  ChatMemberDeletionData,
} from "@workquest/database-models/lib/models";
import {
  GetChatByIdHandler,
  GetChatByIdPostValidationHandler,
  GetChatMemberByUserHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  GetChatMemberPostLimitedAccessPermissionHandler,
  GetChatMemberPostValidationHandler,
  RemoveStarFromChatHandler,
  RemoveStarFromMessageHandler,
} from "../handlers";
import {
  CreateGroupChatComposHandler,
  SendMessageToUserComposHandler,
  LeaveFromGroupChatComposHandler,
  AddUsersInGroupChatComposHandler,
  RemoveMemberFromGroupChatComposHandler,
  SendMessageToChatComposHandler,
  RemoveChatFromListComposHandler,
  SetMessagesAsReadComposHandler
} from "../handlers/compositions";
import { MarkMessageStarComposHandler } from "../handlers/compositions/chat/MarkMessageStarComposHandler";
import { MarkChatStarComposHandler } from "../handlers/compositions/chat/MarkChatStarComposHandler";
//TODO - ?
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
  );
  const chatDeletionDataLiteral = literal((
    `(NOT EXISTS(SELECT "id" FROM "ChatDeletionData" WHERE "chatMemberId" = "meMember"."id") ` +
    'OR (SELECT "createdAt" FROM "Messages" WHERE "Chat"."id" = "Messages"."chatId" ORDER BY "Messages"."createdAt" DESC LIMIT 1 OFFSET 0 ) > ' +
    '(SELECT "updatedAt" FROM "ChatDeletionData" WHERE "chatMemberId" = "meMember"."id"))'
  ));
  const openQuestChatLiteral = literal(
    '"questChat->quest"."assignedWorkerId" IS NOT NULL'
  )

  const where = {
    chatDeletionDataLiteral,
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
    as: 'chatMemberData',
    attributes: [
      "lastReadMessageId",
      "unreadCountMessages",
      "lastReadMessageNumber",
    ],
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
    where: {
      [Op.and]: [
        chatTypeLiteral,
        {
          [Op.or]: [
            { userId: { [Op.ne]: r.auth.credentials.id } },
            { adminId: { [Op.ne]: r.auth.credentials.id } },
          ],
        },
      ]
    },
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
      as: 'chatMemberData',
      attributes: [
        "lastReadMessageId",
        "unreadCountMessages",
        "lastReadMessageNumber",
      ],
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

  if (
    (r.query.questChatStatus === QuestChatStatus.Open || r.query.questChatStatus === QuestChatStatus.Close) &&
    (r.query.type === ChatType.Quest)
  ) {
    include.push({
      model: QuestChat,
      as: 'questChat',
      include: [{
        model: Quest.unscoped(),
        attributes: ["id"],
        as: 'quest',
        where: {
          assignedWorkerId: openQuestChatLiteral,
        }
      }],
      where: { status: r.query.questChatStatus },
    });
  }

  if (r.query.q) {
    where[Op.or] = [
      searchByQuestNameLiteral,
      searchByGroupNameLiteral,
      searchByFirstAndLastNameLiteral,
    ];

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
//TODO - ?
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
      as: 'chatMemberData',
      attributes: [
        "lastReadMessageId",
        "unreadCountMessages",
        "lastReadMessageNumber"
      ],
    }, {
      model: ChatDeletionData,
      as: 'chatDeletionData',
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
    order: [['createdAt', r.query.sort.createdAt]],
  });

  return output({ count, messages: rows, chat });
}
//TODO - ?
export async function getUserChat(r) {
  const { chatId } = r.params as { chatId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  return output(chat);
}
//TODO - ?
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
//TODO - ?
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
//TODO: test
export async function createGroupChat(r) {
  const chatName: string = r.payload.name;
  const chatCreator: User = r.auth.credentials;
  const userIds: string[] = r.payload.userIds;

  const [chat, messageWithInfo] = await new CreateGroupChatComposHandler(r.server.app.db)
    .Handle({
      userIds,
      chatName,
      chatCreator,
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
//TODO: test
export async function sendMessageToUser(r) {
  const meUser: User = r.auth.credentials;

  const { userId } = r.params as { userId: string };
  const { text, mediaIds } = r.payload as { text: string, mediaIds: string[] }

  const [recipientUser, message] = await new SendMessageToUserComposHandler(r.server.app.db)
    .Handle({
      text,
      userId,
      meUser,
      mediaIds,
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
//TODO: test
export async function sendMessageToChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };
  const { text, mediaIds } = r.payload as { text: string, mediaIds: string[] };

  const [ chat, message, meMember ] = await new SendMessageToChatComposHandler(r.server.app.db)
    .Handle({
      text,
      meUser,
      chatId,
      mediaIds,
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
      chatId,
      status: MemberStatus.Active,
    }
  });

  r.server.app.broker.sendChatNotification({
    data: message.toJSON(),
    action: ChatNotificationActions.newMessage,
    recipients: members.map(({ userId, adminId}) => userId || adminId),
  });

  return output(message);
}
//TODO: test
export async function removeMemberFromGroupChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId, userId } = r.params as { chatId: string, userId: string };

  const [groupChat, messageWithInfo, meMember] = await new RemoveMemberFromGroupChatComposHandler(r.server.app.db)
    .Handle({
      meUser,
      chatId,
      userId,
    });

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
//TODO: test
export async function leaveFromGroupChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  const [groupChat, messageWithInfo, meMember] = await new LeaveFromGroupChatComposHandler(r.server.app.db)
    .Handle({
      chatId,
      meUser,
    });

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
//TODO: test
export async function addUsersInGroupChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };
  const { userIds } = r.payload as { userIds: string[] };

  const [ groupChat, messagesWithInfo, meMember ] = await new AddUsersInGroupChatComposHandler(r.server.app.db)
    .Handle({
      meUser,
      chatId,
      userIds,
    });

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
//TODO: test
export async function removeChatFromList(r) {
  const meUser: User = r.auth.credentials;
  const { chatId } = r.params as { chatId: string };

  await new RemoveChatFromListComposHandler(r.server.app.db)
    .Handle({
      meUser,
      chatId
    });

  return output();
}
//TODO Здесь не композиция, нужно подумать, какой base handler использовать
export async function setMessagesAsRead(r) {
  const meUser: User = r.auth.credentials
  const { chatId } = r.params as { chatId: string };
  const { messageId } = r.payload as { messageId: string };

  const [chat, message, meMember] = await new SetMessagesAsReadComposHandler(r.server.app.db)
    .Handle({
      meUser,
      chatId,
      messageId,
    });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chat.id,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderMemberId: meMember.id,
  });

  await updateCountUnreadChatsJob({
    members: [meMember],
  });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.messageReadByRecipient,
  //   recipients: otherSenders.map((sender) => sender.senderMemberId),
  //   data: message,
  // });

  return output();
}
//TODO - ?
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
//TODO Здесь не композиция, нужно подумать, какой base handler использовать
export async function markMessageStar(r) {
  const meUser: User = r.auth.credentials;

  const { chatId, messageId } = r.params as { chatId: string, messageId: string };

  await new MarkMessageStarComposHandler(r.server.app.db).Handle({
    meUser,
    chatId,
    messageId,
  });

  return output();
}
//TODO - ?
export async function removeStarFromMessage(r) {
  const meUser: User = r.auth.credentials;

  const { messageId } = r.params as { messageId: string };

  await new RemoveStarFromMessageHandler().Handle({ user: meUser, messageId });

  return output();
}
//TODO Здесь не композиция, нужно подумать, какой base handler использовать
export async function markChatStar(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  await new MarkChatStarComposHandler(r.server.app.db)
    .Handle({
      chatId,
      meUser,
    });

  return output();
}
//TODO - ?
export async function removeStarFromChat(r) {
  const meUser: User = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  await new RemoveStarFromChatHandler().Handle({ user: meUser, chatId });

  return output();
}
