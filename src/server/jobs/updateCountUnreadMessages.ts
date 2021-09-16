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

  if (chatMember.lastReadMessageId === payload.lastUnreadMessage.id) {
    if (chatMember.unreadCountMessages === 0) return;

    unreadMessageCounter = { unreadCountMessages: 0 };
  } else {
    const unreadMessageCount = await Message.count({
      where: {
        createdAt: {
          [Op.between]: [payload.lastUnreadMessage.createdAt, chatMember.lastReadMessage.createdAt]
        }
      }
    });

    const unreadCountMessages = chatMember.unreadCountMessages - unreadMessageCount + 1;

    unreadMessageCounter = {
      unreadCountMessages: unreadCountMessages < 0 ? 0 : unreadCountMessages,
      lastReadMessageId: payload.lastUnreadMessage.id,
    };
  }

  await chatMember.update(unreadMessageCounter);
}

