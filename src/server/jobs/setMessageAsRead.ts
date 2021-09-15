import { addJob } from "../utils/scheduler";
import { ChatMember, Message, SenderMessageStatus } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"

export interface Data{
  messageId: string,
  chatId: string,
  userId: string,
}

export async function setMessageAsReadJob(payload: Data) {
  return addJob("setMessageAsRead", payload);
}

export default async function setMessageAsRead(payload: Data) {
  const message = await Message.findByPk(payload.messageId);
  message.mustBeChat(payload.chatId);

  const messages = await Message.findAndCountAll({
    where: {
      chatId: payload.chatId,
      senderStatus: SenderMessageStatus.unread,
      createdAt: {
        [Op.lte]: message.createdAt
      }
    }
  });

  for(let messageCounter of messages.rows) {
    await messageCounter.update({
      senderStatus: SenderMessageStatus.read,
    });
  }

  await ChatMember.update({lastReadMessageId: payload.messageId},
    {where: {userId: payload.userId, chatId: payload.chatId}});
}

