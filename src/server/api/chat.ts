import { error, output } from "../utils";
import { server } from "../index";
import { Chat } from "../models/Chat";
import { Op } from "sequelize";
import { Message } from "../models/Message";
import { Errors } from "../utils/errors";
import { Media } from "../models/Media";
import { Favorite } from "../models/Favorite";


function getAlias(isPrivate, receiver, groupsAmount) {
  if (isPrivate && !receiver) {
    return "Favorite";
  }
  if (isPrivate && receiver) {
    return receiver;
  }
  return `Group_${groupsAmount + 1}`;
}

export async function createChat(r) {
  try {
    if (r.payload.membersId.indexOf(r.auth.credentials.id) === -1) {
      return error(404000, "Action not allowed", null);
    }

    if (r.payload.isPrivate === true) {
      const chat: any = await Chat.findOne({
        where: {
          membersId: {
            [Op.eq]: r.payload.membersId
          }
        }
      });
      if (chat) {
        return error(400000, "Bad request, chat exist", null);
      }
    }
    const groupsAmount = await Chat.count({
      where: {
        isPrivate: false
      }
    });

    const receiver = r.payload.membersId.filter(function(id) {
      return r.auth.credentials.id !== id;
    });

    const create: any = await Chat.create({
      userId: r.auth.credentials.id,
      alias: getAlias(r.payload.isPrivate, receiver[0], groupsAmount),
      membersId: r.payload.membersId,
      isPrivate: r.payload.isPrivate
    });
    const id: any = create.id;
    return output(id);
  } catch (err) {
    console.log(err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function renameChat(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  if (!chat) {
    throw error(Errors.Forbidden, "This chat not exist", {});
  }
  if (chat.userId !== r.auth.credentials.id) {
    return error(404000, "User can't rename this chat", null);
  }
  await chat.update({alias: r.payload.newAlias});
  return output({ message: "Chat renamed" });
}

export async function getChats(r) {
  try {
    const { offset, limit } = r.query;
    const chats = await Chat.findAndCountAll({
      limit: limit,
      offset: offset,
      include: {
        limit: 1,
        model: Message,
        as: 'Message',
        order: [ [ 'createdAt', 'DESC' ]]
      },
      where: {
        membersId: {
          [Op.contains]: r.auth.credentials.id
        }
      },
    });
    if (!chats) {
      return error(404000, "Not found", null);
    }
    return output(chats);
  } catch (err) {
    console.log("getChats", err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function getMessages(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  if (!chat) {
    error(Errors.NotFound, "Chat not found", {});
  }
  chat.checkChatMember(r.auth.credentials.id);
  const object: any = {
    limit: r.query.limit,
    offset: r.query.offset,
    where: {
      [Op.and]: [
        { chatId: r.params.chatId },
        { usersDel: { [Op.notIn]: [r.auth.credentials.id] } }
      ]
    }
  };
  const messages = await Message.findAll(object);
  server.publish("/api/v1/chat/{r.params.chatId}", {
    message: messages
  });
  return output({ messages: messages, chatInfo: chat });
}

export async function sendMessage(r) {
  let mediaIds = [];

  if (typeof r.payload.file !== "undefined") {
    for (let file of r.payload.file) {
      const create: any = await Media.create({
        userId: file.userId,
        contentType: file.contentType,
        url: file.url,
        hash: file.hash
      });
      mediaIds.push(create.id);
    }
  }

  const chat = await Chat.findByPk(r.params.chatId);
  if (!chat) {
    throw error(Errors.Forbidden, "This chat not exist", {});
  }

  chat.checkChatMember(r.auth.credentials.id);

  const message = await Message.create({
    userId: r.auth.credentials.id,
    chatId: r.params.chatId,
    mediaId: mediaIds,
    data: r.payload.data
  });

  if (message) {
    server.publish(`/api/v1/chat/${r.params.chatId}`, {
      message: message
    });
    return output({ message: message });
  } else {
    return error(500000, "Message is not saved", null);
  }
}

export async function deleteMessage(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  if (!chat) {
    throw error(Errors.Forbidden, "This chat not exist", {});
  }
  chat.checkChatMember(r.auth.credentials.id);

  const message = await Message.findByPk(r.params.messageId);

  if (!message) {
    throw error(Errors.Forbidden, "This message not exist", {});
  }
  message.isFromThisChat(r.params.chatId);
  message.isAuthor(r.auth.credentials.id);

  if (r.payload.onlyAuthor) {
    await message.update({
      usersDel: [...message.usersDel, r.auth.credentials.id]
    });
    return output({ message: "Success delete for author" });
  }

  if (!r.payload.onlyAuthor) {
    const mediasId = [...message.mediaId];
    for (const mediaId of mediasId) {
      await Media.destroy({
        where: {
          id: mediaId
        }
      });
    }
    await message.destroy();
    return output({ message: "Success delete for all" });
  }
  return output({ message: "Message not deleted" });
}

export async function addFavorite(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  if (!chat) {
    throw error(Errors.Forbidden, "This chat not exist", {});
  }
  chat.checkChatMember(r.auth.credentials.id);

  const message = await Message.findByPk(r.params.messageId);

  if (!message) {
    throw error(Errors.Forbidden, "This message not exist", {});
  }
  message.isFromThisChat(r.params.chatId);

  const favorite = await Favorite.create({
    userId: r.auth.credentials.id,
    messageId: r.params.messageId
  });

  if (!favorite) {
    return output({ message: "Message not added to favorites" });
  }

  return output({ message: "Message added to favorites" });
}

export async function removeFavorite(r) {
  const favorite = await Favorite.findOne({ where: { messageId: r.params.messageId } });

  if (favorite.userId === r.auth.credentials.id) {
    await favorite.destroy();
    return output({ message: "Message remove from favorites" });
  }

  return output({ message: "It is not user's favorite message" });
}

export async function getFavorites(r) {
  const favorites = await Favorite.findAndCountAll({
    where: { userId: r.auth.credentials.id },
    include: {
      model: Message,
      as: 'message',
      attributes: ['data', 'mediaId', 'chatId']
    },
    attributes: ['id', 'messageId']
  });
  if (favorites) {
    return output(favorites);
  }

  return output({ message: "No favorite messages" });
}
