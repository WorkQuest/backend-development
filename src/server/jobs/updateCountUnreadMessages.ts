import { Op } from 'sequelize';
import { addJob } from '../utils/scheduler';
import {
  Message,
  ChatMember,
  ChatMemberData,
} from '@workquest/database-models/lib/models';

export type MemberUnreadMessagesPayload = {
  chatId: string;
  readerMemberId: string;
  lastUnreadMessage: { id: string; number: number };
};

export async function updateCountUnreadMessagesJob(payload: MemberUnreadMessagesPayload) {
  return addJob('updateCountUnreadMessages', payload);
}

export default async function updateCountUnreadMessages(payload: MemberUnreadMessagesPayload) {
  const chatMemberData = await ChatMemberData.findOne({
    where: { chatMemberId: payload.readerMemberId },
    include: [{
      model: ChatMember,
      as: 'chatMember',
      where: { chatId: payload.chatId }
    }]
  });

  let unreadMessageCounter: {
    unreadCountMessages: number;
    lastReadMessageId?: string;
    lastReadMessageNumber?: number;
  } = null;

  if (chatMemberData.lastReadMessageId === payload.lastUnreadMessage.id) {
    if (chatMemberData.unreadCountMessages === 0) return;

    unreadMessageCounter = { unreadCountMessages: 0 };
  } else {
    const firstUnreadMessageNumber = chatMemberData.lastReadMessageNumber
      ? chatMemberData.lastReadMessageNumber
      : 1

    const unreadMessageCount = await Message.count({
      where: {
        id: { [Op.ne]: chatMemberData.lastReadMessageId },
        senderMemberId: { [Op.ne]: chatMemberData.chatMemberId },
        number: {
          [Op.between]: [firstUnreadMessageNumber, payload.lastUnreadMessage.number],
        },
      },
    });

    const unreadCountMessages = chatMemberData.unreadCountMessages - unreadMessageCount;

    unreadMessageCounter = {
      unreadCountMessages: unreadCountMessages < 0
        ? 0
        : unreadCountMessages,
      lastReadMessageId: payload.lastUnreadMessage.id,
      lastReadMessageNumber: payload.lastUnreadMessage.number,
    };
  }

  await chatMemberData.update(unreadMessageCounter);
}
