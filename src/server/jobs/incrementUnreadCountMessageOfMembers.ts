import { literal, Op } from 'sequelize';
import { addJob } from '../utils/scheduler';
import { ChatMember, ChatMemberData, MemberStatus } from "@workquest/database-models/lib/models";

export type UnreadMessageIncrementPayload = {
  readonly chatId: string;
  readonly skipMemberIds: string[];
}

export async function incrementUnreadCountMessageOfMembersJob(payload: UnreadMessageIncrementPayload) {
  return addJob('incrementUnreadCountMessageOfMembers', payload);
}

export default async function incrementUnreadCountMessageOfMembers(payload: UnreadMessageIncrementPayload) {
  const whereLiteralBuilder = (chatId: string, skipMembersIds: string[]) =>
    literal(
    `((SELECT "ChatMembers"."chatId" FROM "ChatMembers" WHERE "id" = "ChatMemberData"."chatMemberId") = '${ chatId }' ` +
    `AND (SELECT "ChatMembers"."status" FROM "ChatMembers" WHERE "id" = "ChatMemberData"."chatMemberId") = ${ MemberStatus.Active }) ` +
    `AND "ChatMemberData"."chatMemberId" != ANY(string_to_array('${(skipMembersIds.join(','))}', ',')) `
  );

  await ChatMemberData.increment('unreadCountMessages' ,{
    where: {
      [Op.and]: whereLiteralBuilder(payload.chatId, payload.skipMemberIds)
    },
  });
}



