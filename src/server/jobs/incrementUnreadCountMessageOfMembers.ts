import { addJob } from '../utils/scheduler';
import { ChatMember, ChatMemberData } from "@workquest/database-models/lib/models";
import { literal, Op } from "sequelize";

export type UnreadMessageIncrementPayload = {
  chatId: string;
  notifierMemberId?: string;
};

export async function incrementUnreadCountMessageOfMembersJob(payload: UnreadMessageIncrementPayload) {
  return addJob('incrementUnreadCountMessageOfMembers', payload);
}

export default async function incrementUnreadCountMessageOfMembers(payload: UnreadMessageIncrementPayload) {
  const chatMemberData = await ChatMemberData.findAll({
    where: { chatMemberId: { [Op.ne]: payload.notifierMemberId } },
    include: [{
      model: ChatMember,
      where: { chatId: payload.chatId },
      as: 'chatMember',
    }]
  });

  chatMemberData.map(async data => {
    await data.update({ unreadCountMessages: data.unreadCountMessages + 1 })
  });
}
