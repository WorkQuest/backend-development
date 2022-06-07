import { Op } from "sequelize";
import { addJob } from "../utils/scheduler";
import {
  AdminChatStatistic,
  ChatMember,
  ChatMemberData, MemberStatus,
  MemberType,
  UserChatsStatistic
} from "@workquest/database-models/lib/models";

export type UpdateCountUnreadChatsPayload = {
  readonly members: ChatMember[];
};

export async function updateCountUnreadChatsJob(payload: UpdateCountUnreadChatsPayload) {
  return addJob('updateCountUnreadChats', payload);
}

async function updateUserChatStatistic(userId: string, unreadChatsCounter: number) {
  const [chatsStatistic, isCreated] = await UserChatsStatistic.findOrCreate({
    where: { userId },
    defaults: { userId, unreadCountChats: unreadChatsCounter },
  });

  if (!isCreated) {
    await chatsStatistic.update({ unreadCountChats: unreadChatsCounter });
  }
}

async function updateAdminChatStatistic(adminId: string, unreadChatsCounter: number) {
  const [chatsStatistic, isCreated] = await AdminChatStatistic.findOrCreate({
    where: { adminId },
    defaults: { adminId, unreadCountChats: unreadChatsCounter },
  });

  if (!isCreated) {
    await chatsStatistic.update({ unreadCountChats: unreadChatsCounter });
  }
}

export default async function updateCountUnreadChats(payload: UpdateCountUnreadChatsPayload) {
  // TODO для юзеров и для админов + вынести в отдельные функции
  for (const member of payload.members) {
    const unreadChatsCounter = await ChatMember.unscoped().count({
      include: [{
        model: ChatMemberData,
        as: 'chatMemberData',
        where: {
          unreadCountMessages: { [Op.ne]: 0 },
        },
      }],
      where: {
        [Op.or]: [{ userId: member.userId }, { adminId: member.adminId }],
        status: MemberStatus.Active,
      }
    });

    if (member.type === MemberType.User) {
      await updateUserChatStatistic(member.userId, unreadChatsCounter);
    }

    if (member.type === MemberType.Admin) {
      await updateAdminChatStatistic(member.adminId, unreadChatsCounter);
    }
  }
}
