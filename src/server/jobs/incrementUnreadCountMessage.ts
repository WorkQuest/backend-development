
import { addJob } from "../utils/scheduler";
import { ChatMember, Message, SenderMessageStatus } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"

export interface Data {
  chatId: string,
  userId: string,
  conditional?: boolean,
}

export async function incrementUnreadCountMessageJob(payload: Data) {
  return addJob("incrementUnreadCountMessage", payload);
}

export default async function incrementUnreadCountMessage(payload: Data) {
  await ChatMember.increment('unreadCountMessages', {
    where: { chatId: payload.chatId, userId: payload.conditional ? {[Op.ne]: payload.userId} : payload.userId }
  });
}

