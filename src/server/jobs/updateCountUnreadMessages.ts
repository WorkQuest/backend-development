import { addJob } from "../utils/scheduler";
import { Message, ChatMember } from "@workquest/database-models/lib/models";
import { Op } from "sequelize";

export interface MemberUnreadMessagesPayload {
  lastUnreadMessage: { id: string, createdAt: Date };
  readerUserId: string;
  chatId: string;
}

export async function updateCountUnreadMessagesJob(payload: MemberUnreadMessagesPayload) {
  return addJob("updateCountUnreadMessages", payload);
}

export default async function updateCountUnreadMessages(payload: MemberUnreadMessagesPayload) {
  const chatMember = await ChatMember.unscoped().findOne({
    where: {
      userId: payload.readerUserId,
      chatId: payload.chatId,
    },
  });

  let unreadMessageCounter: {
    unreadCountMessages: number,
    lastReadMessageId?: string,
    lastReadMessageDate?: Date,
  };

  if (chatMember.lastReadMessageId === payload.lastUnreadMessage.id) {
    if (chatMember.unreadCountMessages === 0) return;

    unreadMessageCounter = { unreadCountMessages: 0 };
  } else {
    const minDate = new Date(0); //1970, January 1, 12:00 am, the most min date in SQL
    const unreadMessageCount = await Message.count({
      where: {
        createdAt: {
          [Op.between]: [
            chatMember.lastReadMessageDate ? chatMember.lastReadMessageDate : minDate,
            payload.lastUnreadMessage.createdAt,
          ]
        },
        id: { [Op.ne]: chatMember.lastReadMessageId },
        senderUserId: { [Op.ne]: chatMember.userId }
      }
    });

    const unreadCountMessages = chatMember.unreadCountMessages - unreadMessageCount;

    unreadMessageCounter = {
      unreadCountMessages: unreadCountMessages < 0 ? 0 : unreadCountMessages,
      lastReadMessageId: payload.lastUnreadMessage.id,
      lastReadMessageDate: payload.lastUnreadMessage.createdAt,
    };
  }

  await chatMember.update(unreadMessageCounter);
}

