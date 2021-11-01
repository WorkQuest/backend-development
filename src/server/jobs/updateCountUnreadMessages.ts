import { addJob } from "../utils/scheduler";
import { Message, ChatMember } from "@workquest/database-models/lib/models";
import { Op } from "sequelize";

export type MemberUnreadMessagesPayload = {
  lastUnreadMessage: { id: string, number: number };
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
    lastReadMessageNumber?: number,
  } = null;

  if (chatMember.lastReadMessageId === payload.lastUnreadMessage.id) {
    if (chatMember.unreadCountMessages === 0) return;

    unreadMessageCounter = { unreadCountMessages: 0 };
  } else {
    const minDate = new Date(0);
    const unreadMessageCount = await Message.count({
      where: {
        id: { [Op.ne]: chatMember.lastReadMessageId },
        senderUserId: { [Op.ne]: chatMember.userId },
        createdAt: {
          [Op.between]: [
            chatMember.lastReadMessageNumber ? chatMember.lastReadMessageNumber : 1,
            payload.lastUnreadMessage.number,
          ]
        },
      }
    });

    const unreadCountMessages = chatMember.unreadCountMessages - unreadMessageCount;

    unreadMessageCounter = {
      unreadCountMessages: unreadCountMessages < 0 ? 0 : unreadCountMessages,
      lastReadMessageId: payload.lastUnreadMessage.id,
      lastReadMessageNumber: payload.lastUnreadMessage.number,
    };
  }

  await chatMember.update(unreadMessageCounter);
}

