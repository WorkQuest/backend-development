import { addJob } from "../utils/scheduler";
import { Message, Chat, ChatMember } from "@workquest/database-models/lib/models";
import { error } from "../utils";
import { Errors } from "../utils/errors";
import { Op } from "sequelize";

export interface Data {
  message: { id: string, createdAt: Date };
  readerUserId: string,
  chatId: string,
}

export async function countUnreadMessagesJob(payload: Data) {
  return addJob("countUnreadMessages", payload);
}

export default async function countUnreadMessages(payload: Data) {
  const chatMember = await ChatMember.unscoped().findOne({
    attributes: ["lastReadMessageId"],
    where: {
      userId: payload.readerUserId,
      chatId: payload.chatId,
    },
    include: {
      model: Message.unscoped(),
      as: 'lastReadMessage',
      attributes: ["createdAt"]
    }
  });

  let unreadMessageCounter: {
    unreadCountMessages: number,
    lastReadMessageId?: string,
  };

  if (chatMember.lastReadMessageId === payload.message.id && chatMember.unreadCountMessages !== 0) {
    unreadMessageCounter = { unreadCountMessages: 0 };
  } else if (chatMember.lastReadMessageId !== payload.message.id) {
    const unreadMessageCount = await Message.count({
      where: {
        createdAt: {
          [Op.between]: [payload.message.createdAt, chatMember.lastReadMessage.createdAt]
        }
      }
    });

    const unreadCountMessages = chatMember.unreadCountMessages - unreadMessageCount + 1;

    unreadMessageCounter = {
      unreadCountMessages: unreadCountMessages < 0 ? 0 : unreadCountMessages,
      lastReadMessageId: payload.message.id,
    };
  } else {
    return;
  }

  await chatMember.update(unreadMessageCounter);
}

