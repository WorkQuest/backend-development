import {addJob} from "../utils/scheduler";
import {ChatMember} from "@workquest/database-models/lib/models";
import {Op} from "sequelize"

export interface UnreadMessageIncrementPayload {
  chatId: string;
  notifierUserId?: string;
}

export async function incrementUnreadCountMessageJob(payload: UnreadMessageIncrementPayload) {
  return addJob("incrementUnreadCountMessage", payload);
}

export default async function incrementUnreadCountMessage(payload: UnreadMessageIncrementPayload) {
  await ChatMember.increment('unreadCountMessages', {
    where: {
      ...(payload.notifierUserId && { userId: { [Op.ne]: payload.notifierUserId } }),
      chatId: payload.chatId,
    }
  });
}

