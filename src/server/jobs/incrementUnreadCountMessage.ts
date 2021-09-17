
import { addJob } from "../utils/scheduler";
import { ChatMember, Message, SenderMessageStatus } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"

export interface IncrementUnreadCounterPayload {
  chatId: string,
  updateMessageCounterUserId: string,
  conditional?: boolean,
}

export async function incrementUnreadCountMessageJob(payload: IncrementUnreadCounterPayload) {
  return addJob("incrementUnreadCountMessage", payload);
}

export default async function incrementUnreadCountMessage(payload: IncrementUnreadCounterPayload) {
  await ChatMember.increment('unreadCountMessages', {
    where: { chatId: payload.chatId, userId: payload.conditional ? {[Op.ne]: payload.updateMessageCounterUserId} : payload.updateMessageCounterUserId }
  });
}

