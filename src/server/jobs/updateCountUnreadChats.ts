import { addJob } from "../utils/scheduler";
import { ChatMember, ChatsStatistic } from "@workquest/database-models/lib/models";
import { Op } from "sequelize";

export type UserUnreadChatsPayload = {
  userId: string,
}

export async function updateCountUnreadMessagesJob(payload: UserUnreadChatsPayload) {
  return addJob("updateCountUnreadMessages", payload);
}

export default async function updateCountUnreadMessages(payload: UserUnreadChatsPayload) {
  const unreadChatsCounter = await ChatMember.unscoped().count({
    where: {
      userId: payload.userId,
      unreadCountMessages: {[Op.ne]: 0},
    },
  });

  await ChatsStatistic.update({ unreadChats: unreadChatsCounter }, { where: { userId: payload.userId } });
}

