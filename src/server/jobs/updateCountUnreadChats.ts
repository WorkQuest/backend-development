import { literal, Op } from 'sequelize';
import { addJob } from '../utils/scheduler';
import {
  MemberType,
  ChatMember,
  ChatMemberData,
  UserChatsStatistic,
} from "@workquest/database-models/lib/models";

export type UpdateCountUnreadChatsPayload = {
  readonly chatId: string;
  readonly skipMembersIds: ReadonlyArray<string>;
};

export async function updateCountUnreadChatsJob(payload: UpdateCountUnreadChatsPayload) {
  return addJob('updateCountUnreadChats', payload);
}

export default async function updateCountUnreadChats(payload: UpdateCountUnreadChatsPayload) {
  // TODO для юзеров и для админов + вынести в отдельные функции

  const updateValueLiteral = literal(`
    SELECT COUNT("ChatMember"."id") 
    FROM "ChatMembers" 
    WHERE 
        "ChatMembers"."userId" = "Users"."id"
        AND 1 = (
            CASE WHEN EXISTS(
                SELECT "ChatMemberData"."id" 
                FROM "ChatMemberData" 
                WHERE 
                    "ChatMemberData"."memberId" =  "ChatMembers"."id" 
                    AND "ChatMembers"."unreadCountMessages" != 0
            )
        )
  `);

  const whereLiteralBuilder = (chatId: string) => literal(`
    "ChatMembers"."chatId" = ${ chatId } 
    AND "ChatMembers"."status" = 'active'
    AND "ChatMembers"."type" = 'User'
  `);

  await UserChatsStatistic.update({ unreadCountChats: updateValueLiteral }, {
    where: {
      [Op.and]: [
        whereLiteralBuilder(payload.chatId),
      ]
    },
  })

  // for (const userId of payload.userIds) {
  //   const unreadChatsCounter = await ChatMember.unscoped().findAndCountAll({
  //     where: {
  //       userId: userId,
  //     },
  //     include: [{
  //       model: ChatMemberData,
  //       as: 'chatMemberData',
  //       where: { unreadCountMessages: { [Op.ne]: 0 } }
  //     }]
  //   });
  //
  //   const [chatsStatistic, isCreated] = await UserChatsStatistic.findOrCreate({
  //     where: { userId },
  //     defaults: { userId, type: MemberType.User, unreadCountChats: unreadChatsCounter.count },
  //   });
  //
  //   if (!isCreated) {
  //     await chatsStatistic.update({ unreadCountChats: unreadChatsCounter.count });
  //   }
  // }
}
