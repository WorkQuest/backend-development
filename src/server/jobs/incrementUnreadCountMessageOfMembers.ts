import { addJob } from '../utils/scheduler';
import { ChatMember, ChatMemberData } from "@workquest/database-models/lib/models";
import { literal, Op } from "sequelize";

export type UnreadMessageIncrementPayload = {
  chatId: string;
  notifierMemberId: string;
  withoutMemberIds?: string[]
};

export async function incrementUnreadCountMessageOfMembersJob(payload: UnreadMessageIncrementPayload) {
  return addJob('incrementUnreadCountMessageOfMembers', payload);
}

export default async function incrementUnreadCountMessageOfMembers(payload: UnreadMessageIncrementPayload) {
  const updatingChatMemberData = await ChatMemberData.findAll({
    where: { chatMemberId: { [Op.notIn]: [payload.notifierMemberId, ...payload.withoutMemberIds] } },
    include: [{
      model: ChatMember,
      where: { chatId: payload.chatId },
      as: 'chatMember',
    }]
  });

  const updatingChatMemberDataIds = updatingChatMemberData.map(member => { return member.id }); // Mode.increment (update) не позволяет делать include

  await ChatMemberData.increment( // у каждого участника разное число сообщений, инкремент - самое оптимальное
    'unreadCountMessages',
   {
      where: { chatMemberId: { [Op.in]: updatingChatMemberDataIds } }
  });
}
