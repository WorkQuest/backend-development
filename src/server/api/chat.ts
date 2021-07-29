import { error, output } from "../utils";
import { server } from "../index";
import { Chat } from "../models/Chat";
import { Op } from "sequelize";
import { Message } from "../models/Message";
import { Errors } from "../utils/errors";
import { Media } from "../models/Media";
import { Favorite } from "../models/Favorite";

export async function chatTest(r) {
  try {
    const timePoll = new Date();
    server.publish("/chat/create/", {
      createdAt: timePoll.toString()
    });
    return timePoll;
  } catch (e) {
    console.log("deleteNews", e);
    return error(500000, "Internal server error", {});
  }
}

export async function createChat(r) {
  try {
    const userId = r.auth.credentials.id;
    for (let i = 0; i < r.payload.membersId.length; i++) {
      if (r.payload.membersId[i] !== userId) {
      }
    }
    if (r.payload.isPrivate === true){
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
    const create: any = await Chat.create({
      userId: r.auth.credentials.id,
      membersId: r.payload.membersId,
      isPrivate: r.payload.isPrivate
    });
    const id: any = create.id;
    return output (id);
  } catch (err) {
    return error(500000, "Internal Server Error", null);
  }
}

export async function getChats(r) {
  try {
    const { offset, limit } = r.query;
    const chats = await Chat.findAndCountAll({
      limit: limit,
      offset: offset,
      // include: { //TODO create find last message
      //   model:
      //   as: 'ChatInfo',
      // },
      where: {
        membersId: {
          [Op.contains]: r.auth.credentials.id
        },
      },
      attributes: ["id"]
    });
    if (!chats) {
      return error(404000, "Not found", null);
    }
    return output(chats);
  } catch (err) {
    console.log("getFiles", err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function getMessages(r) {
  const chat =  await Chat.findByPk(r.params.chatId);
  if (!chat) {
    error(Errors.NotFound, "Chat not found", {});
  }
  chat.checkChatMember(r.auth.credentials.id);
  const object: any = {
    limit: r.query.limit,
    offset: r.query.offset,
    where: {
      [Op.and] : [
        { chatId: r.params.chatId },
        { usersDel: {[Op.notIn]: [r.auth.credentials.id]} }
      ]
    },
  }
  const messages = await Message.findAll(object,);
  return output({ messages: messages, chatInfo: chat, });
}

export async function sendMessage(r) {
  let mediaIds = [];

  if (typeof r.payload.file !== "undefined") {
    for(let file of r.payload.file) {
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
    data: r.payload.data,
  });

  if (message) {
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
  message.isAuthor(r.auth.credentials.id);

  const favorite = await Favorite.create({
    userId: r.auth.credentials.id,
    messageId: r.params.messageId,
  });

  if (!favorite) {
    return output({ message: "Message not added to favorites" });
  }

  return output({ message: "Message added to favorites" });
}

export async function removeFavorite(r) {
  const favorite = await Favorite.findOne({ where: { messageId: r.params.messageId }});

  if (favorite.userId === r.auth.credentials.id) {
    await favorite.destroy();
    return output({ message: "Message remove from favorites" });
  }

  return output({ message: "It is not user's favorite message" });
}
