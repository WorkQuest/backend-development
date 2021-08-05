import { error, output } from "../utils";
import { server } from "../index";
import { Chat } from "../models/Chat";
import { Op } from "sequelize";
import { Message } from "../models/Message";
import { Media } from "../models/Media";
import { Favorite } from "../models/Favorite";
import { User } from "../models/User";
import { getAlias } from "../utils/chat";


export async function createChat(r) {
    if (r.payload.membersId.indexOf(r.auth.credentials.id) === -1) {
      return error(403000, "Action not allowed", {});
    }
    const users: any = await User.findAll({
      where: {
        id: {[Op.in]: r.payload.membersId}
      }
    });

    if (users.length !== r.payload.membersId.length) {
      return error(404000, "User is not found", {});
    }

    if (r.payload.isPrivate) {
      const chat: any = await Chat.findOne({
        where: {
          [Op.or]: [{membersId: {[Op.eq]: r.payload.membersId }}, {membersId: {[Op.eq]: [...r.payload.membersId].reverse() }}],
          isPrivate: true
        }
      });

      if (chat) {
        return error(404000, "Chat exist", {});
      }
    }

    if (r.payload.isPrivate && r.payload.membersId.indexOf(r.auth.credentials.id) !== -1 && r.payload.membersId.length === 1) {
      const create: any = await Chat.create({
        userId: r.auth.credentials.id,
        alias:  await getAlias(r),
        membersId: r.payload.membersId,
        isPrivate: r.payload.isPrivate
      });
      server.publish("/api/v1/chats", {
        message: "New chat created",
      });
      return output(create.id);
    }

    if (r.payload.isPrivate && r.payload.membersId.length !== 2) {
      return error(404000, "The number of users does not match", {});
    }

    const create: any = await Chat.create({
      userId: r.auth.credentials.id,
      alias:  await getAlias(r),
      membersId: r.payload.membersId,
      isPrivate: r.payload.isPrivate
    });

    server.publish("/api/v1/chats", {
      message: "New chat created",
    });

    return output(create.id);
}

export async function renameChat(r) {
    const chat = await Chat.findByPk(r.params.chatId);

    if (!chat) {
      return error(404000, "Chat not found", {});
    }

    if (chat.userId !== r.auth.credentials.id) {
      return error(403000, "User can't rename this chat", {});
    }

    await chat.update({ alias: r.payload.newAlias });
    return output({ status: "Success" });
}

export async function getChats(r) {
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
      return error(404000, "Chats not found", {});
    }
    return output(chats);
}

export async function getMessages(r) {
    const chat = await Chat.findByPk(r.params.chatId);

    if (!chat) {
      return error(404000, "Chat not found", {});
    }

    chat.checkChatMember(r.auth.credentials.id);
    const object: any = {
      limit: r.query.limit,
      offset: r.query.offset,
      order: [["createdAt", "DESC"]],
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
}

export async function sendMessage(r) {
    const chat = await Chat.findByPk(r.params.chatId);

    if (!chat) {
      return error(404000, "Chat not found", {});
    }

    chat.checkChatMember(r.auth.credentials.id);

    if (r.payload.data === "" && r.payload.file.length === 0) {
      return error(404000, "Can't send empty message", {});
    }

    const message = await Message.create({
      userId: r.auth.credentials.id,
      chatId: r.params.chatId,
      mediaId: r.payload.file,
      data: r.payload.data
    });
    await chat.changed('updatedAt', true);
    await chat.save();

    server.publish(`/api/v1/chat/${r.params.chatId}`, {
      message: message
    });
    return output({ message: message });
}

export async function deleteMessage(r) {
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

      await chat.changed('updatedAt', true);
      await chat.save();

      server.publish(`/api/v1/chat/${r.params.chatId}`, {
        message: "Message deleted",
      });
      return output({status: "Success"});
    }

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

    await chat.changed('updatedAt', true);
    await chat.save();

    server.publish(`/api/v1/chat/${r.params.chatId}`, {
      message: "Message deleted",
    });
    return output({ status: "Success" });
}

export async function addFavorite(r) {
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

    await Favorite.create({
      userId: r.auth.credentials.id,
      messageId: r.params.messageId
    });

    return output({ status: "Success" });
}

export async function removeFavorite(r) {
    const favorite = await Favorite.findOne({ where: { messageId: r.params.favoriteMessageId } });

    if (!favorite) {
      return error(404000, "Message not found", {});
    }

    if (favorite.userId !== r.auth.credentials.id) {
      return error(403000, "It is not user's favorite message", {});
    }

    await favorite.destroy();
    return output({ status: "Success" });
}


export async function getFavorites(r) {
    const favorites = await Favorite.findAndCountAll({
      where: { userId: r.auth.credentials.id },
      include: {
        model: Message,
        as: "message",
        attributes: ["data", "mediaId", "chatId"]
      },
      attributes: ["id", "messageId"]
    });

    return output(favorites);
}
