import { Chat, ChatMember, ChatType, Media, Message, User } from "@workquest/database-models/lib/models";
import { error, output } from "../utils";
import { getMedias } from "../utils/medias";
import { Errors } from "../utils/errors";
import { Op } from "sequelize";

export async function getUserChats(r) {
  const { count, rows } = await Chat.unscoped().findAndCountAll({
    attributes: ['id', 'type', 'lastMessageDate'],
    include: [{
      model: ChatMember,
      as: 'otherMember',
      required: false,
      attributes: ['userId'],
      where: {
        userId: { [Op.ne]: r.auth.credentials.id }
      },
      include: [{
        model: User.unscoped(),
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'avatarId'],
        include: [{
          model: Media.scope('urlOnly'),
          as: 'avatar'
        }]
      }]
    }, {
      model: ChatMember,
      where: { userId: r.auth.credentials.id },
      required: true,
      as: 'chatMembers',
      attributes: [],
    }, {
      model: Message,
      as: 'lastMessage',
      // required: true,
      attributes: ['senderUserId', 'text', 'createdAt'],
      include: [{
        model: User.unscoped(),
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'avatarId'],
        include: [{
          model: Media.scope('urlOnly'),
          as: 'avatar'
        }]
      }]
    }],
    order: [
      ['lastMessageDate', 'DESC'],
    ],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({
    count,
    chats: rows,
  });
}

export async function createGroupChat(r) {
  const transaction = await r.server.app.db.transaction();
  const memberUserIds: string[] = r.payload.memberUserIds;

  const groupChat = await Chat.create({
    ownerUserId: r.auth.credentials.id,
    type: ChatType.group
  }, { transaction });

  if (!memberUserIds.includes(r.auth.credentials.id)) {
    memberUserIds.push(r.auth.credentials.id);
  }

  await User.usersMustExist(memberUserIds);

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
    order: [
      ['createdAt', 'DESC']
    ],
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
  await User.userMustExist(r.params.userId);

  if (r.params.userId === r.auth.credentials.id) {
    return error(Errors.InvalidPayload, "You can't send a message to yourself", {});
  }

  const transaction = await r.server.app.db.transaction();
  const medias = await getMedias(r.payload.medias);

  let chat = await Chat.findOne({
    where: { type: ChatType.private },
    include: [{
      model: ChatMember,
      as: 'chatMembers',
      where: { userId: r.auth.credentials.id },
      required: true,
      attributes: [],
    }, {
      model: ChatMember,
      as: 'chatMembers',
      where: { userId: r.params.userId },
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
    text: r.payload.text
  }, { transaction });

  await message.$set('medias', medias, { transaction });

  await chat.update({
    lastMessageId: message.id,
    lastMessageDate: message.createdAt
  }, { transaction });

  await transaction.commit();

  await r.server.publish('/notifications', {
    type: 'message.new',
    data: message,
    userId: r.params.userId
  });

  return output();
}

export async function sendMessageToChat(r) {
  const transaction = await r.server.app.db.transaction();
  const medias = await getMedias(r.payload.medias);

  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  await chat.mustHaveMember(r.auth.credentials.id);

  const message = await Message.create({
    senderUserId: r.auth.credentials.id,
    chatId: chat.id,
    text: r.payload.text
  }, { transaction });

  await message.$set('medias', medias, { transaction });

  await chat.update({lastMessageId: message.id, lastMessageDate: message.createdAt});

  await transaction.commit();

  return output();
}

export async function addUserInGroupChat(r) {
  await User.userMustExist(r.params.userId);

  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  chat.mustHaveType(ChatType.group);
  chat.mustHaveOwner(r.auth.credentials.id);

  await ChatMember.create({
    chatId: chat.id,
    userId: r.params.userId,
  });

  return output();
}

export async function removeUserInGroupChat(r) {
  await User.userMustExist(r.params.userId);

  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  chat.mustHaveType(ChatType.group);
  chat.mustHaveOwner(r.auth.credentials.id);
  await chat.mustHaveMember(r.params.userId);

  await ChatMember.destroy({
    where: {
      chatId: chat.id,
      userId: r.params.userId,
    }
  });

  return output();
}

export async function leaveFromGroupChat(r) {
  const transaction = await r.server.app.db.transaction();
  const chat = await Chat.findByPk(r.params.chatId);

  if (!chat) {
    return error(Errors.NotFound, "Chat not found", {});
  }

  chat.mustHaveType(ChatType.group);
  await chat.mustHaveMember(r.auth.credentials.id);

  if (chat.ownerUserId === r.auth.credentials.id) {
    // const firsMember = await User.findOne({
    //   include: [{
    //     model: ChatMember.unscoped(),
    //     where: { chatId: chat.id },
    //     attributes: [],
    //     order: [
    //       ['createdAt', 'ABC']
    //     ],
    //   }]
    // });
    //
    // await chat.update({ ownerUserId: firsMember.id }, { transaction });
  }

  await ChatMember.destroy({
    where: { chatId: chat.id, userId: r.auth.credentials.id },
    transaction
  });

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
