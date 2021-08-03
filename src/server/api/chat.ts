import { error, output } from "../utils";
import { server } from "../index";
import { Chat } from "../models/Chat";
import { Op } from "sequelize";
import { Message } from "../models/Message";
import { Media } from "../models/Media";
import { Favorite } from "../models/Favorite";
import { User } from "../models/User";


function getAlias(isPrivate, receiver, groupsAmount) {
  if (isPrivate && !receiver) {
    return "Favorite";
  }
  if (isPrivate && receiver) {
    return "";
  }
  return `Group_${groupsAmount + 1}`;
}

export async function createChat(r) {
  try {
    if (r.payload.membersId.indexOf(r.auth.credentials.id) === -1) {
      return error(403000, "Action not allowed", null);
    }
    const users: any = await User.findAll({
      where: {
        id: {[Op.in]: r.payload.membersId}
      }
    });
    if (users.length !== r.payload.membersId.length) {
      return error(404000, "User is not found", null);
    }
    if (r.payload.isPrivate === true && r.payload.membersId.length !== 2) {
      return error(404000, "The number of users does not match", null);
    }
    if (r.payload.isPrivate) {
      const chat: any = await Chat.findOne({
        where: {
            [Op.or]: [{membersId: {[Op.eq]: r.payload.membersId }}, {membersId: {[Op.eq]: [...r.payload.membersId].reverse() }}],
          isPrivate: true
        }
      });
      if (chat) {
        return error(404000, "Bad request, chat exist", null);
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
    server.publish("/api/v1/chats", {
      message: "New chat created",
    });
    return output(id);
  } catch (err) {
    console.log(err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function renameChat(r) {
  try {
    const chat = await Chat.findByPk(r.params.chatId);
    if (!chat) {
      return error(404000, "This chat not exist", {});
    }
    if (chat.userId !== r.auth.credentials.id) {
      return error(403000, "User can't rename this chat", null);
    }
    await chat.update({ alias: r.payload.newAlias });
    return output({ status: "Success" });
  } catch (err) {
    console.log(err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function getChats(r) {
  try {
    const { offset, limit } = r.query;
    const chats = await Chat.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [["updatedAt", "DESC"]],
      include: {
        limit: 1,
        model: Message,
        as: "Message",
        order: [["createdAt", "DESC"]]
      },
      where: {
        membersId: {
          [Op.contains]: r.auth.credentials.id
        }
      }
    });
    if (!chats) {
      return error(404000, "Chats not found", null);
    }
    return output(chats);
  } catch (err) {
    console.log("getChats", err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function getMessages(r) {
  try {
    const chat = await Chat.findByPk(r.params.chatId);
    if (!chat) {
      return error(404000, "Chat not found", {});
    }
    chat.checkChatMember(r.auth.credentials.id);
    const object: any = {
      limit: r.query.limit,
      offset: r.query.offset,
      where: {
        [Op.and]: [
          { chatId: r.params.chatId }
        ]
      }
    };
    const messages = await Message.findAll(object);
    const result = messages.filter(function(message) {
      return message.usersDel.indexOf(r.auth.credentials.id) === -1;
    });
    server.publish("/api/v1/chat/{r.params.chatId}", {
      message: result
    });
    return output({ messages: result, chatInfo: chat });
  } catch (err) {
    console.log(err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function sendMessage(r) {
  try {
    const chat = await Chat.findByPk(r.params.chatId);
    if (!chat) {
      return error(404, "Chat not found", {});
    }
    chat.checkChatMember(r.auth.credentials.id);
    const message = await Message.create({
      userId: r.auth.credentials.id,
      chatId: r.params.chatId,
      mediaId: r.payload.file,
      data: r.payload.data
    });
    await chat.changed('updatedAt', true);
    await chat.save();

    if (message) {
      server.publish(`/api/v1/chat/${r.params.chatId}`, {
        message: message
      });
      return output({ message: message });
    } else {
      return error(404000, "Message is not saved", null);
    }
  } catch (err) {
    console.log(err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function deleteMessage(r) {
  try {
    const chat = await Chat.findByPk(r.params.chatId);
    if (!chat) {
      return error(404000, "Chat not found", {});
    }
    chat.checkChatMember(r.auth.credentials.id);
    const message = await Message.findByPk(r.params.messageId);
    if (!message) {
      return error(404000, "Message not found", {});
    }
    message.isFromThisChat(r.params.chatId);
    if (r.payload.onlyMember) {
      await message.update({
        usersDel: [...message.usersDel, r.auth.credentials.id]
      });
      return output({status: "Success"});
    }
    if (!r.payload.onlyMember) {
      message.isAuthor(r.auth.credentials.id);
      const mediasId = [...message.mediaId];
      for (const mediaId of mediasId) {
        await Media.destroy({
          where: {
            id: mediaId
          }
        });
      }
      await message.destroy();
      return output({ status: "Success" });
    }
    return error(404000, "Message not deleted", null);
  } catch (err) {
    console.log(err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function addFavorite(r) {
  try {
    const chat = await Chat.findByPk(r.params.chatId);
    if (!chat) {
      return error(404000, "Chat not found", {});
    }
    chat.checkChatMember(r.auth.credentials.id);
    const message = await Message.findByPk(r.params.messageId);
    if (!message) {
      return error(404000, "Message not found", {});
    }
    message.isFromThisChat(r.params.chatId);
    const favorite = await Favorite.create({
      userId: r.auth.credentials.id,
      messageId: r.params.messageId
    });
    if (!favorite) {
      return error(404000, "Message not added to favorites", null);
    }
    return output({ status: "Success" });
  } catch (err) {
    console.log(err);
    return error(500000, "Internal Server Error", null);
  }
}

export async function removeFavorite(r) {
  try {
    const favorite = await Favorite.findOne({ where: { messageId: r.params.messageId } });
    if (!favorite) {
      return error(404000, "Message not found", null);
    }
    if (favorite.userId === r.auth.credentials.id) {
      await favorite.destroy();
      return output({ status: "Success" });
    }
    return error(403000, "It is not user's favorite message", null);
  } catch (err) {
    console.log(err);
    return error(500000, "Internal Server Error", null);
  }
}


export async function getFavorites(r) {
  try {
    const favorites = await Favorite.findAndCountAll({
      where: { userId: r.auth.credentials.id },
      include: {
        model: Message,
        as: "message",
        attributes: ["data", "mediaId", "chatId"]
      },
      attributes: ["id", "messageId"]
    });
    if (favorites) {
      return output(favorites);
    }
    return error(404000, "No favorite messages", null);
  } catch (err) {
    console.log(err);
    return error(500000, "Internal Server Error", null);
  }
}
