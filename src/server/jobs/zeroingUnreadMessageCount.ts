import { addJob } from "../utils/scheduler";
import { ChatMember, } from "@workquest/database-models/lib/models";

export interface ZeroingUnreadMessagePayload {
  chatId: string,
  lastReadMessageId: string,
  zeroingCounterUserId: string,
}

export async function zeroingUnreadMessageCountJob(payload: ZeroingUnreadMessagePayload) {
  return addJob("zeroingUnreadMessageCount", payload);
}

export default async function zeroingUnreadMessageCount(payload: ZeroingUnreadMessagePayload) {
  await ChatMember.update({ unreadCountMessages: 0, lastReadMessageId: payload.lastReadMessageId }, {
    where: { chatId: payload.chatId, userId: payload.zeroingCounterUserId }
  });
}
