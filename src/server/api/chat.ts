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
} from "@workquest/database-models/lib/models";

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
    attributes: { include: [] },
    include: [userMemberInclude],
    order: [ ['lastMessageDate', 'DESC'] ],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, chats });
}

export async function createGroupChat(r) {
  const memberUserIds: string[] = r.payload.memberUserIds;

  if (!memberUserIds.includes(r.auth.credentials.id)) {
    memberUserIds.push(r.auth.credentials.id);
  }

  await User.usersMustExist(memberUserIds);

  const transaction = await r.server.app.db.transaction();
  const groupChat = await Chat.build({
    name: r.payload.name,
    ownerUserId: r.auth.credentials.id,
    type: ChatType.group,
  });

  const message = await Message.build({
    senderUserId: r.auth.credentials.id,
    chatId: groupChat.id,
    type: MessageType.info,
  });

  const infoMessage = await InfoMessage.build({
    messageId: message.id,
    messageAction: MessageAction.groupChatCreate,
  });

  groupChat.lastMessageId = message.id;
  groupChat.lastMessageDate = message.createdAt;

  await Promise.all([
    groupChat.save({ transaction }),
    message.save({ transaction }),
    infoMessage.save({ transaction }),
  ]);

  await groupChat.$set('members', memberUserIds, { transaction });

  await transaction.commit();

  return output(
    await Chat.findByPk(groupChat.id)
  );
}

export async function getChatMessages(r) {
  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  await chat.mustHaveMember(r.auth.credentials.id);

  const { count, rows } = await Message.findAndCountAll({
    where: { chatId: chat.id },
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({
    count, messages: rows
  });
}

export async function getUserChat(r) {
  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  await chat.mustHaveMember(r.auth.credentials.id);

  return output(chat);
}

export async function sendMessageToUser(r) {
  if (r.params.userId === r.auth.credentials.id) {
    return error(Errors.InvalidPayload, "You can't send a message to yourself", {});
  }

  await User.userMustExist(r.params.userId);

  const medias = await getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  let chat = await Chat.findOne({
    where: { type: ChatType.private },
    include: [{
      model: ChatMember,
      as: 'firstMemberInPrivateChat',
      where: { userId: r.params.userId },
      required: true,
      attributes: [],
    }, {
      model: ChatMember,
      as: 'secondMemberInPrivateChat',
      where: { userId: r.auth.credentials.id },
      required: true,
      attributes: [],
    }]
  });

  if (!chat) {
    chat = await Chat.create({
      type: ChatType.private,
    }, { transaction });

    await chat.$set('members', [r.auth.credentials.id, r.params.userId],
      { transaction });
  }

  const message = await Message.create({
    senderUserId: r.auth.credentials.id,
    chatId: chat.id,
    type: MessageType.message,
    senderStatus: SenderMessageStatus.unread,
    text: r.payload.text
  }, { transaction });

  await message.$set('medias', medias, { transaction });

  await chat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction });

  await transaction.commit();

  await r.server.publish('/notifications/chat', {
    notificationOwnerUserId: r.auth.credentials.id,
    chatId: chat.id, message
  });

  return output();
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

  await chat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction });

  await transaction.commit();

  await r.server.publish('/notifications/chat', {
    notificationOwnerUserId: r.auth.credentials.id,
    chatId: chat.id, message,
  });

  return output();
}

export async function addUserInGroupChat(r) {
  await User.userMustExist(r.params.userId);

  const groupChat = await Chat.findByPk(r.params.chatId);

  if (!groupChat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  groupChat.mustHaveType(ChatType.group);
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
    messageId: message.id,
    messageAction: MessageAction.groupChatAddUser,
  }, { transaction });

  return output();
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
    messageId: message.id,
    messageAction: MessageAction.groupChatDeleteUser,
  }, { transaction });

  return output();
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

  return output();
}

export async function getChatMembers(r) {
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
