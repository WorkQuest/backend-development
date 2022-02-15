import { addJob } from '../utils/scheduler';
import { ChatMember, ChatsStatistic } from '@workquest/database-models/lib/models';
import { Op } from 'sequelize';

export type UserUnreadChatsPayload = {
  userIds: string[];
  chatId: string[];
};

export async function updateCountUnreadChatsJob(payload: UserUnreadChatsPayload) {
  return addJob('updateCountUnreadChats', payload);
}

//TODO: исправить джобу

export default async function updateCountUnreadChats(payload: UserUnreadChatsPayload) {
  for (const memberId of payload.userIds) {
    const unreadChatsCounter = await ChatMember.unscoped().count({
      where: {
        userId: memberId,
        unreadCountMessages: { [Op.ne]: 0 },
      },
    });

    const member = await ChatMember.findOne({where: { userId: memberId, chatId: chat.id } })

    const [chatsStatistic, isCreated] = await ChatsStatistic.findOrCreate({
      where: { memberId },
      defaults: { memberId, unreadCountChats: unreadChatsCounter },
    });

    if (!isCreated) {
      await chatsStatistic.update({ unreadCountChats: unreadChatsCounter });
    }
  }
}
