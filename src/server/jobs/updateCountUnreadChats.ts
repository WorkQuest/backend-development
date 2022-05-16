import { Op } from 'sequelize';
import { addJob } from '../utils/scheduler';
import { ChatMember, ChatMemberData, UserChatsStatistic, MemberType, MemberStatus } from "@workquest/database-models/lib/models";

export type UpdateCountUnreadChatsPayload = {
  readonly chatId: string;
  readonly skipMembersIds: ReadonlyArray<string>;
};

export async function updateCountUnreadChatsJob(payload: UpdateCountUnreadChatsPayload) {
  return addJob('updateCountUnreadChats', payload);
}

export default async function updateCountUnreadChats(payload: UpdateCountUnreadChatsPayload) {
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

    const [chatsStatistic, isCreated] = await UserChatsStatistic.findOrCreate({
      where: { userId },
      defaults: { userId, type: MemberType.User, unreadCountChats: unreadChatsCounter.count },
    });

    if (!isCreated) {
      await chatsStatistic.update({ unreadCountChats: unreadChatsCounter.count });
    }
  }
}
