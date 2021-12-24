import { addJob } from "../utils/scheduler";
import { ChatMember, ChatsStatistic } from "@workquest/database-models/lib/models";
import { Op } from "sequelize";

export type UserUnreadChatsPayload = {
  userIds: string[],
}

export async function updateCountUnreadChatsJob(payload: UserUnreadChatsPayload) {
  return addJob("updateCountUnreadChats", payload);
}

export default async function updateCountUnreadChats(payload: UserUnreadChatsPayload) {

  payload.userIds.map( async (userId) => {
    const unreadChatsCounter = await ChatMember.unscoped().count({
      where: {
        userId: userId,
        unreadCountMessages: { [Op.ne]: 0 },
      },
    });
    await ChatsStatistic.update({ unreadChats: unreadChatsCounter }, { where: { userId: userId } });
  });

}

