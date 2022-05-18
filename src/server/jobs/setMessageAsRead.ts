import { Op } from 'sequelize';
import { addJob } from '../utils/scheduler';
import {
  Message,
  SenderMessageStatus,
} from '@workquest/database-models/lib/models';

export interface MessageAsReadPayload {
  chatId: string;
  senderMemberId: string;
  lastUnreadMessage: { id: string; number: number };
}

export async function setMessageAsReadJob(payload: MessageAsReadPayload) {
  return addJob('setMessageAsRead', payload);
}

export default async function setMessageAsRead(payload: MessageAsReadPayload) {
  await Message.update(
    {
      senderStatus: SenderMessageStatus.Read,
    },
    {
      where: {
        chatId: payload.chatId,
        senderStatus: SenderMessageStatus.Unread,
        senderMemberId: { [Op.ne]: payload.senderMemberId },
        number: { [Op.lte]: payload.lastUnreadMessage.number },
      },
    },
  );
}
