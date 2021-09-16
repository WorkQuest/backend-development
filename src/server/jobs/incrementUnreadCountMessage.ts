
import { addJob } from "../utils/scheduler";
import { ChatMember, Message, SenderMessageStatus } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"

export interface Data {
  chatId: string,
  userId: object,
}

export async function incrementUnreadCountMessageJob(payload: Data) {
  return addJob("incrementUnreadCountMessage", payload);
}

export default async function incrementUnreadCountMessage(payload: Data) {
  await ChatMember.increment('unreadCountMessages', {
    where: { chatId: payload.chatId, userId: payload.userId }
  });
}

