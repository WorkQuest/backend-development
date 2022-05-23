import { literal, Op } from 'sequelize';
import { addJob } from '../utils/scheduler';
import { ChatMemberData } from '@workquest/database-models/lib/models';

export type UnreadMessageIncrementPayload = {
  readonly chatId: string;
  readonly skipMemberIds: string[];
}

export async function incrementUnreadCountMessageOfMembersJob(payload: UnreadMessageIncrementPayload) {
  return addJob('incrementUnreadCountMessageOfMembers', payload);
}

export default async function incrementUnreadCountMessageOfMembers(payload: UnreadMessageIncrementPayload) {
  const whereLiteralBuilder = (chatId: string, skipMembersIds: string[]) =>
    literal(`"ChatMemberData"."chatMemberId" = "ChatMembers"."id" ` +
    `AND ("ChatMembers"."chatId" = ${chatId} AND "ChatMembers"."status" = 'active') ` +
    `AND "ChatMembers"."id" not in (${skipMembersIds.join(',')}) `
  );

  await ChatMemberData.update({  }, {
    where: {
      [Op.and]: whereLiteralBuilder(payload.chatId, payload.skipMemberIds)
    },
  });
}



