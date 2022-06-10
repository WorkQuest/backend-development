import { literal, Op } from "sequelize";
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
    const userOrAdminLiteral = literal(
      `(CASE WHEN EXISTS (SELECT "id" FROM "Users" WHERE "Users"."id" = '${ member.userId }') ` +
      `THEN "userId" = '${ member.userId }' ELSE "adminId" = '${ member.adminId }' END)`
    )
    const unreadChatsCounter = await ChatMember.unscoped().count({
      include: [{
        model: ChatMemberData,
        as: 'chatMemberData',
        where: {
          unreadCountMessages: { [Op.ne]: 0 },
        },
      }],
      where: {
        userOrAdminLiteral,
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

  // const updateValueLiteral = literal(`
  //   (SELECT COUNT("ChatMembers"."id")
  //   FROM "ChatMembers"
  //   WHERE
  //       "ChatMembers"."userId" != '${ payload.senderMemberId }'
  //       AND 1 = (
  //           CASE WHEN EXISTS(
  //               SELECT "ChatMemberData"."id"
  //               FROM "ChatMemberData"
  //               WHERE
  //                   "ChatMemberData"."chatMemberId" = "ChatMembers"."id"
  //                   AND "ChatMemberData"."unreadCountMessages" != 0
  //           ) THEN 1 END
  //       )) FROM "ChatMembers"
  // `);
  //
  // const whereLiteralBuilder = (chatId: string) => literal(`
  //   "ChatMembers"."chatId" = '${ chatId }'
  //   AND "ChatMembers"."status" = ${ MemberStatus.Active }
  //   AND "ChatMembers"."type" = '${ MemberType.User }'
  // `);
  //
  // await UserChatsStatistic.update({ updatedAt: new Date(), unreadCountChats: updateValueLiteral }, {
  //   where: {
  //     [Op.and]: [
  //       whereLiteralBuilder(payload.chatId),
  //     ]
  //   },
  // })
}
