import { addJob } from '../utils/scheduler';
import { ChatMember, ChatMemberData, ChatsStatistic } from "@workquest/database-models/lib/models";
import { Op } from 'sequelize';

export type UserUnreadChatsPayload = {
  userIds: string[];
};

export async function updateCountUnreadChatsJob(payload: UserUnreadChatsPayload) {
  return addJob('updateCountUnreadChats', payload);
}

export default async function updateCountUnreadChats(payload: UserUnreadChatsPayload) {
  for (const userId of payload.userIds) {
    const unreadChatsCounter = await ChatMember.unscoped().findAndCountAll({
      where: {
        userId: userId,
      },
      include: [{
        model: ChatMemberData,
        as: 'chatMemberData',
        where: { unreadCountMessages: { [Op.ne]: 0 } }
      }]
    });

    const [chatsStatistic, isCreated] = await ChatsStatistic.findOrCreate({
      where: { userId },
      defaults: { userId, unreadCountChats: unreadChatsCounter.count },
    });

    if (!isCreated) {
      await chatsStatistic.update({ unreadCountChats: unreadChatsCounter.count });
    }
  }
}
