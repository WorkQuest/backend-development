import {error, output} from "../utils";
import {getMedias} from "../utils/medias";
import {Errors} from "../utils/errors";
import {Op} from "sequelize";
import {incrementUnreadCountMessageOfMembersJob} from "../jobs/incrementUnreadCountMessageOfMembers";
import {resetUnreadCountMessagesOfMemberJob} from "../jobs/resetUnreadCountMessagesOfMember";
import {setMessageAsReadJob} from "../jobs/setMessageAsRead";
import {updateCountUnreadMessagesJob} from "../jobs/updateCountUnreadMessages";
import {ChatController} from "../controllers/chat/controller.chat";
import {MessageController} from "../controllers/chat/controller.message";
import {
  Chat,
  ChatMember,
  ChatType,
  InfoMessage,
  Message,
  MessageAction,
  MessageType,
  SenderMessageStatus,
  StarredMessage,
  StarredChat,
  User,
} from "@workquest/database-models/lib/models";
import { ChatNotificationActions, publishChatNotifications } from "../websocket/websocket.chat";

export async function getUserChats(r) {
  const include = [{
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

  const count = await Chat.unscoped().count({ include });
  const chats = await Chat.findAll({
    include,
    order: [ ['lastMessageDate', 'DESC'] ],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, chats });
}

export async function getChatMessages(r) {
  const chatController = new ChatController(r.params.chatId);
  const chat = await chatController.findModel();

  await chatController.chatMustHaveMember(r.auth.credentials.id);

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
  const chatController = new ChatController(r.params.chatId);
  const chat = await chatController.findModel({
    model: StarredChat,
    as: "star",
    required: false,
  });

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  return output(chat);
}

export async function getChatMembers(r) {
  const chatController = new ChatController(r.params.chatId);
  const chat = await chatController.findModel();

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const { count, rows } = await User.scope('shortWithAdditionalInfo').findAndCountAll({
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
    message.save({ transaction }),
    infoMessage.save({ transaction }),
  ]);

  await groupChat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction })

  const chatMembers = memberUserIds.map(userId => {
    return {
      userId,
      chatId: groupChat.id,
      unreadCountMessages: (userId === r.auth.credentials.id ? 0 : 1),
      lastReadMessageId: (userId === r.auth.credentials.id ? message.id : null),
      lastReadMessageDate: (userId === r.auth.credentials.id ? message.createdAt : null),
    }
  });

  await ChatMember.bulkCreate(chatMembers, { transaction });

  await transaction.commit();

  const result = await Chat.findByPk(groupChat.id);

  await publishChatNotifications(r.server, {
    recipients: memberUserIds.filter(userId => userId !== r.auth.credentials.id),
    action: ChatNotificationActions.groupChatCreate,
    data: result, // TODO lastReadMessageId: message.id
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
    text: r.payload.text,
  });

  const [chat, isChatCreated] = await Chat.findOrCreate({
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
    }],
    defaults: {
      type: ChatType.private,
      lastMessageId: message.id,
      lastMessageDate: message.createdAt,
    }, transaction,
  });

  message.chatId = chat.id;

  await message.save({ transaction });
  await message.$set('medias', medias, { transaction });

  if (isChatCreated) {
    await ChatMember.bulkCreate([{
      unreadCountMessages: 0, /** Because created */
      chatId: chat.id,
      userId: r.auth.credentials.id,
      lastReadMessageId: message.id, /** Because created */
      lastReadMessageNumber: message.number,
    }, {
      unreadCountMessages: 1, /** Because created */
      chatId: chat.id,
      userId: r.params.userId,
      lastReadMessageId: null, /** Because created */
      lastReadMessageNumber: null,
    }], { transaction })
  } else {
    await chat.update({
      lastMessageId: message.id,
      lastMessageDate: message.createdAt,
    }, { transaction });
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
      chatId: chat.id, notifierUserId: r.auth.credentials.id,
    });
  }

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chat.id,
    senderId: r.auth.credentials.id,
  });

  const result = await Message.findByPk(message.id);

  await publishChatNotifications(r.server, {
    action: ChatNotificationActions.newMessage,
    recipients: [r.params.userId],
    data: result,
  });

  return output(result);
}

export async function sendMessageToChat(r) {
  const medias = await getMedias(r.payload.medias);
  const chatController = new ChatController(r.params.chatId);
  const chat = await chatController.findModel();

  await chatController.chatMustHaveMember(r.auth.credentials.id);

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

  await resetUnreadCountMessagesOfMemberJob({
    chatId: chat.id,
    lastReadMessageId: message.id,
    userId: r.auth.credentials.id,
    lastReadMessageNumber: message.number,
  });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: chat.id, notifierUserId: r.auth.credentials.id,
  });

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderId: r.auth.credentials.id,
  });

  const members = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  const result = await Message.findByPk(message.id);

  await publishChatNotifications(r.server, {
    action: ChatNotificationActions.newMessage,
    recipients: members.map(member => member.userId),
    data: result,
  });

  return output(result);
}

export async function addUserInGroupChat(r) {
  await User.userMustExist(r.params.userId);

  const chatController = new ChatController(r.params.chatId);
  const groupChat = await chatController.findModel();

  await chatController.chatMustHaveType(ChatType.group);
  await chatController.chatMustHaveOwner(r.auth.credentials.id);

  const message = Message.build({
    senderUserId: r.auth.credentials.id,
    chatId: groupChat.id,
    type: MessageType.info,
  });

  const chatMember = ChatMember.build({
    chatId: groupChat.id,
    userId: r.params.userId,
    unreadCountMessages: 1, /** Because info message */
    lastReadMessageId: groupChat.lastMessage, /** Because new member */
  });

  const infoMessage = InfoMessage.build({
    messageId: message.id,
    userId: r.params.userId,
    messageAction: MessageAction.groupChatAddUser,
  });

  const transaction = await r.server.app.db.transaction();

  await Promise.all([
    message.save({ transaction }),
    chatMember.save({ transaction }),
    infoMessage.save({ transaction }),
  ]);

  await groupChat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction });

  await transaction.commit();

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

  const members = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  const result = await Message.findByPk(message.id);

  await publishChatNotifications(r.server, {
    action: ChatNotificationActions.groupChatAddUser,
    recipients: members.map(member => member.userId),
    data: result,
  });

  return output(result);
}

export async function removeUserInGroupChat(r) {
  await User.userMustExist(r.params.userId);

  const chatController = new ChatController(r.params.chatId);
  const groupChat = await chatController.findModel();

  await chatController.chatMustHaveType(ChatType.group);
  await chatController.chatMustHaveOwner(r.auth.credentials.id);
  await chatController.chatMustHaveMember(r.params.userId);

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

  await groupChat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction });

  await transaction.commit();

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

  const members = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  const result = await Message.findByPk(message.id);

  await publishChatNotifications(r.server, {
    action: ChatNotificationActions.groupChatDeleteUser,
    recipients: members.map(member => member.userId),
    data: result,
  });

  return output(result);
}

export async function leaveFromGroupChat(r) {
  const chatController = new ChatController(r.params.chatId);
  const groupChat = await chatController.findModel();

  await chatController.chatMustHaveType(ChatType.group);
  await chatController.chatMustHaveMember(r.auth.credentials.id);

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

  await groupChat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt,
  }, { transaction });

  await transaction.commit();

  await incrementUnreadCountMessageOfMembersJob({
    chatId: groupChat.id,
    notifierUserId: r.auth.credentials.id,
  });

  const members = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: groupChat.id, userId: { [Op.ne]: r.auth.credentials.id } }
  });

  const result = await Message.findByPk(message.id);

  await publishChatNotifications(r.server, {
    action: ChatNotificationActions.groupChatLeaveUser,
    recipients: members.map(member => member.userId),
    data: result,
  });

  return output(result);
}

export async function setMessagesAsRead(r) {
  const chatController = new ChatController(r.params.chatId);
  const chat = await chatController.findModel();

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const message = await Message.unscoped().findByPk(r.payload.messageId);

  if (!message) {
    return error(Errors.NotFound, "Message is not found", {});
  }

  const otherSenders = await Message.unscoped().findAll({
    attributes: ["senderUserId"],
    where: {
      senderUserId: { [Op.ne]: r.auth.credentials.id },
      senderStatus: SenderMessageStatus.unread,
      number: { [Op.gte]: message.number },
    },
    group: ["senderUserId"]
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
    senderId: r.auth.credentials.id
  });

  await publishChatNotifications(r.server, {
    action: ChatNotificationActions.messageReadByRecipient,
    recipients: otherSenders.map(sender => sender.senderUserId),
    data: message,
  });

  return output();
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

  return output({ count, rows });
}

export async function markMessageStar(r) {
  const chatController = new ChatController(r.params.chatId);
  const messageController = new MessageController(r.params.messageId);

  const chat = await chatController.findModel();
  const message = await messageController.findModel();

  await chatController.chatMustHaveMember(r.auth.credentials.id);

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

export async function markChatStar(r) {
  const chatController = new ChatController(r.params.chatId);
  const chat = await chatController.findModel();

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  await StarredChat.create({
    userId: r.auth.credentials.id,
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
      userId: r.auth.credentials.id
    }
  });

  return output();
}

