import { literal, Op } from 'sequelize';
import { addJob } from "../utils/scheduler";
import { ChatMemberData } from "@workquest/database-models/lib/models";

export type ResetUnreadCountMessagesPayload = {
  chatId: string,
  memberId: string,
  lastReadMessage: { id: string, number: number },
};

export async function resetUnreadCountMessagesOfMemberJob(payload: ResetUnreadCountMessagesPayload) {
  return addJob('resetUnreadCountMessagesOfMember', payload);
}

export default async function resetUnreadCountMessagesOfMember(payload: ResetUnreadCountMessagesPayload) {
  const whereLiteralBuilder = (chatId: string) =>
    literal(`"ChatMemberData"."chatMemberId" = "ChatMembers"."id" ` +
      `AND ("ChatMembers"."chatId" = ${chatId} AND "ChatMembers"."status" = 'active') `
    );

  await ChatMemberData.update(
    {
      unreadCountMessages: 0,
      lastReadMessageId: payload.lastReadMessage.id,
      lastReadMessageNumber: payload.lastReadMessage.number,
    },
    {
      where: {
        [Op.and]: [
          whereLiteralBuilder(payload.chatId),
          { chatMemberId: payload.memberId },
        ],
      },
    },
  );

  // const chatMember = await ChatMember.findByPk(payload.memberId);
  //
  // if (chatMember.status === MemberStatus.Active) {
  //   await ChatMemberData.update(
  //     {
  //       unreadCountMessages: 0,
  //       lastReadMessageId: payload.lastReadMessage.id,
  //       lastReadMessageNumber: payload.lastReadMessage.number,
  //     },
  //     {
  //       where: { chatMemberId: payload.memberId },
  //     },
  //   );
  // }
}
