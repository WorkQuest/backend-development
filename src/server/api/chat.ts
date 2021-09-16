import { error, output } from "../utils";
import { getMedias } from "../utils/medias";
import { Errors } from "../utils/errors";
import {
  Chat,
  ChatMember,
  ChatType,
  Message,
  User,
  MessageType,
  InfoMessage,
  MessageAction,
  SenderMessageStatus,
  StarredMessage,
} from "@workquest/database-models/lib/models";
import { ChatNotificationActions } from "../utils/chatSubscription";
import { Op } from "sequelize";
import { incrementUnreadCountMessageJob } from "../jobs/incrementUnreadCountMessage";

export async function getUserChats(r) {
  const userMemberInclude = {
    model: ChatMember,
    where: { userId: r.auth.credentials.id },
    required: true,
    as: 'chatMembers',
    attributes: [],
  };

  const count = await Chat.unscoped().count({
    include: userMemberInclude
  });
  const chats = await Chat.findAll({
    include: [userMemberInclude],
    order: [ ['lastMessageDate', 'DESC'] ],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, chats });
}

export async function getChatMessages(r) {
  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  await chat.mustHaveMember(r.auth.credentials.id);

  const { count, rows } = await Message.findAndCountAll({
    where: { chatId: chat.id },
    include: [{
      model: StarredMessage,
      as: "star",
      where: { userId: r.auth.credentials.id },
      required: r.query.starred,
    }],
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count, messages: rows });
}

export async function getUserChat(r) {
  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  await chat.mustHaveMember(r.auth.credentials.id);

  return output(chat);
}

export async function getChatMembers(r) {
  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  await chat.mustHaveMember(r.auth.credentials.id);

  const { count, rows } = await User.scope('short').findAndCountAll({
    include: [{
      model: ChatMember,
      attributes: [],
      as: 'chatMember',
      where: { chatId: chat.id }
    }],
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

  await User.usersMustExist(memberUserIds);

  const transaction = await r.server.app.db.transaction();

  const groupChat = await Chat.create({
    name: r.payload.name,
    ownerUserId: r.auth.credentials.id,
    type: ChatType.group,
  }, { transaction });

  const message = await Message.build({
    senderUserId: r.auth.credentials.id,
    chatId: groupChat.id,
    type: MessageType.info,
  });

  const infoMessage = await InfoMessage.build({
    messageId: message.id,
    messageAction: MessageAction.groupChatCreate,
  });

  await Promise.all([
    groupChat.save({ transaction }),
    message.save({ transaction }),
    infoMessage.save({ transaction }),
  ]);

  await groupChat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction })

  const chatMembers = memberUserIds.map(userId => {
    return {
      unreadCountMessages: (userId === r.auth.credentials.id ? 0 : 1),
      userId, chatId: groupChat.id,
    }
  });

  await ChatMember.bulkCreate(chatMembers, { transaction });

  await transaction.commit();

  const result = await Chat.findByPk(groupChat.id);

  await r.server.publish('/notifications/chat', {
    recipients: memberUserIds.filter(userId => userId !== r.auth.credentials.id),
    action: ChatNotificationActions.groupChatCreate,
    data: result,
  });

  return output(result);
}

export async function sendMessageToUser(r) {
  if (r.params.userId === r.auth.credentials.id) {
    return error(Errors.InvalidPayload, "You can't send a message to yourself", {});
  }

  await User.userMustExist(r.params.userId);

  const medias = await getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  const message = await Message.build({
    senderUserId: r.auth.credentials.id,
    type: MessageType.message,
    senderStatus: SenderMessageStatus.unread,
    text: r.payload.text
  });

  const [chat, isChatCreated] = await Chat.findOrCreate({
    where: { },
    include: [{
      model: ChatMember,
      as: 'firstMemberInPrivateChat',
      where: { userId: r.params.userId},
      required: true,
      attributes: [],
    }, {
      model: ChatMember,
      as: 'secondMemberInPrivateChat',
      where: { userId: r.auth.credentials.id },
      required: true,
      attributes: [],
    }],
    defaults: {
      type: ChatType.private,
      lastMessageId: message.id,
      lastMessageDate: message.createdAt
    }, transaction,
  });

  message.chatId = chat.id;
  await message.$set('medias', medias, { transaction });
  await message.save({ transaction });

  if (isChatCreated) {
    await ChatMember.bulkCreate([{
      unreadCountMessages: 0,
      chatId: chat.id,
      userId: r.auth.credentials.id,
      lastReadMessageId: message.id,
    }, {
      unreadCountMessages: 1, /** Because created */
      chatId: chat.id,
      userId:  r.params.userId,
      /** No lastReadMessageId cause create but not read*/
    }], { transaction })
  } else {
    await ChatMember.update({ unreadCountMessages: 0, lastReadMessageId: message.id,}, {
      transaction, where: { chatId: chat.id, userId: r.auth.credentials.id }
    });

    await incrementUnreadCountMessageJob({
      chatId: chat.id,
      userId: r.params.userId
    });

    // await ChatMember.increment('unreadCountMessages', {
    //   where: { chatId: chat.id, userId: r.params.userId }
    // });

    await chat.update({
      lastMessageId: message.id,
      lastMessageDate: message.createdAt,
    }, { transaction });

    await Message.update({ senderStatus: SenderMessageStatus.read }, {
      transaction, where: { chatId: chat.id, senderUserId: r.params.userId },
    });
  }

  await transaction.commit();

  const result = await Message.findByPk(message.id);

  await r.server.publish('/notifications/chat', {
    action: ChatNotificationActions.newMessage,
    recipients: [r.params.userId],
    data: result,
  });

  return output(result);
}

export async function sendMessageToChat(r) {
  const medias = await getMedias(r.payload.medias);
  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  await chat.mustHaveMember(r.auth.credentials.id);

  const transaction = await r.server.app.db.transaction();

  const message = await Message.create({
    senderUserId: r.auth.credentials.id,
    chatId: chat.id,
    type: MessageType.message,
    text: r.payload.text,
    senderStatus: SenderMessageStatus.unread,
  }, { transaction });

  await message.$set('medias', medias, { transaction });

  await Message.update({ senderStatus: SenderMessageStatus.read }, {
    transaction, where: { chatId: chat.id, senderUserId: { [Op.ne]: r.auth.credentials.id } },
  });

  await ChatMember.update({ unreadCountMessages: 0 },{
    transaction, where: { chatId: chat.id, userId: r.auth.credentials.id },
  });

  await incrementUnreadCountMessageJob({
    chatId: chat.id,
    userId: { [Op.ne]: r.auth.credentials.id }
  });
  // await ChatMember.increment('unreadCountMessages', {
  //   transaction, where: { chatId: chat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  // });

  await chat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction });

  await transaction.commit();

  const members = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  const result = await Message.findByPk(message.id);

  await r.server.publish('/notifications/chat', {
    action: ChatNotificationActions.newMessage,
    recipients: members.map(member => member.userId),
    data: result,
  });

  return output(result);
}

export async function addUserInGroupChat(r) {
  await User.userMustExist(r.params.userId);

  const groupChat = await Chat.findByPk(r.params.chatId);

  if (!groupChat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  groupChat.mustHaveType(ChatType.group);
  await groupChat.mustHaveMember(r.params.chatId);
  groupChat.mustHaveOwner(r.auth.credentials.id);

  const transaction = await r.server.app.db.transaction();

  await ChatMember.create({
    chatId: groupChat.id,
    userId: r.params.userId,
  }, { transaction });

  const message = await Message.create({
    senderUserId: r.auth.credentials.id,
    chatId: groupChat.id,
    type: MessageType.info,
  }, { transaction });

  await InfoMessage.create({
    userId: r.params.userId,
    messageId: message.id,
    messageAction: MessageAction.groupChatAddUser,
  }, { transaction });

  await ChatMember.increment('unreadCountMessages', {
    transaction, where: { chatId: groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  await ChatMember.update({ unreadCountMessages: 0 },{
    transaction, where: { chatId: groupChat.id, userId: r.auth.credentials.id },
  });

  await groupChat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction });

  await transaction.commit();

  const members = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  const result = await Message.findByPk(message.id);

  await r.server.publish('/notifications/chat', {
    action: ChatNotificationActions.groupChatAddUser,
    recipients: members.map(member => member.userId),
    data: result,
  });

  return output(result);
}

export async function removeUserInGroupChat(r) {
  await User.userMustExist(r.params.userId);

  const groupChat = await Chat.findByPk(r.params.chatId);

  if (!groupChat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  groupChat.mustHaveType(ChatType.group);
  groupChat.mustHaveOwner(r.auth.credentials.id);
  await groupChat.mustHaveMember(r.params.userId);

  const transaction = await r.server.app.db.transaction();

  await ChatMember.destroy({
    where: {
      chatId: groupChat.id,
      userId: r.params.userId,
    }, transaction,
  });

  const message = await Message.create({
    senderUserId: r.auth.credentials.id,
    chatId: groupChat.id,
    type: MessageType.info,
  }, { transaction });

  await InfoMessage.create({
    userId: r.params.userId,
    messageId: message.id,
    messageAction: MessageAction.groupChatDeleteUser,
  }, { transaction });

  await ChatMember.increment('unreadCountMessages', {
    transaction, where: { chatId: groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  await ChatMember.update({ unreadCountMessages: 0 },{
    transaction, where: { chatId: groupChat.id, userId: r.auth.credentials.id },
  });

  await groupChat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction });

  await transaction.commit();

  const members = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  const result = await Message.findByPk(message.id);

  await r.server.publish('/notifications/chat', {
    action: ChatNotificationActions.groupChatDeleteUser,
    recipients: members.map(member => member.userId),
    data: result,
  });

  return output(result);
}

export async function leaveFromGroupChat(r) {
  const groupChat = await Chat.findByPk(r.params.chatId);

  if (!groupChat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  groupChat.mustHaveType(ChatType.group);
  await groupChat.mustHaveMember(r.auth.credentials.id);

  if (groupChat.ownerUserId === r.auth.credentials.id) {
    return error(Errors.Forbidden, "User is chat owner", {}); // TODO
  }

  const transaction = await r.server.app.db.transaction();

  await ChatMember.destroy({
    where: { chatId: groupChat.id, userId: r.auth.credentials.id },
    transaction
  });

  const message = await Message.create({
    senderUserId: r.auth.credentials.id,
    chatId: groupChat.id,
    type: MessageType.info,
  }, { transaction });

  await InfoMessage.create({
    messageId: message.id,
    messageAction: MessageAction.groupChatLeaveUser,
  }, { transaction });

  await ChatMember.increment('unreadCountMessages', {
    transaction, where: { chatId: groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  await groupChat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction });

  await transaction.commit();

  const members = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  const result = await Message.findByPk(message.id);

  await r.server.publish('/notifications/chat', {
    action: ChatNotificationActions.groupChatLeaveUser,
    recipients: members.map(member => member.userId),
    data: result,
  });

  return output(result);
}

export async function setMessagesAsRead(r) {
  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  await chat.mustHaveMember(r.auth.credentials.id);

  const { count, rows } = await User.findAndCountAll({
    include: [{
      model: ChatMember,
      attributes: [],
      as: 'chatMember',
      where: { chatId: chat.id }
    }],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({count, members: rows});
}

export async function getUserStarredMessages(r) {
  const { count, rows } = await Message.findAndCountAll({
    include: [{
      model: StarredMessage,
      as: "star",
      where: { userId: r.auth.credentials.id },
      required: true,
    }, {
      model: Chat.unscoped(),
      as: "chat",
    }]
  });

  return output({ count, messages: rows });
}

export async function markMessageStar(r) {
  const message = await Message.findByPk(r.params.messageId);

  if (!message) {
    return error(Errors.NotFound, 'Message is not found', {});
  }

  const chat = await Chat.findByPk(message.chatId);

  if (!chat) {
    return error(Errors.NotFound, 'Chat is not found', {});
  }

  await chat.mustHaveMember(r.auth.credentials.id);

  await StarredMessage.create({
    userId: r.auth.credentials.id,
    messageId: r.params.messageId,
  });

  return output();
}

export async function removeStarFromMessage(r) {
  const starredMessage = await StarredMessage.findOne({
    where: {
      messageId: r.params.messageId,
      userId: r.auth.credentials.id
    }
  });

  if (!starredMessage) {
    return error(Errors.Forbidden, 'Message or message with star not fount', {});
  }

  await starredMessage.destroy();

  return output();
}
