import { literal, Op } from 'sequelize';
import { addJob } from '../utils/scheduler';
import {
  MemberType,
  UserChatsStatistic,
  MemberStatus, ChatMember, ChatMemberData
} from "@workquest/database-models/lib/models";

export type UpdateCountUnreadChatsPayload = {
  //readonly chatId: string;
  readonly userIds: string[];
};

export async function updateCountUnreadChatsJob(payload: UpdateCountUnreadChatsPayload) {
  return addJob('updateCountUnreadChats', payload);
}

export default async function updateCountUnreadChats(payload: UpdateCountUnreadChatsPayload) {
  // TODO для юзеров и для админов + вынести в отдельные функции

  for (const userId of payload.userIds) {
    const unreadChatsCounter = await ChatMember.unscoped().count({
      include: [{
        model: ChatMemberData,
        as: 'chatMemberData',
        where: {
          unreadCountMessages: { [Op.ne]: 0 },
        },
      }],
      where: {
        userId
      }
    })

    const [chatsStatistic, isCreated] = await UserChatsStatistic.findOrCreate({
      where: { userId },
      defaults: { userId, unreadCountChats: unreadChatsCounter },
    });

    if (!isCreated) {
      await chatsStatistic.update({ unreadCountChats: unreadChatsCounter });
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
