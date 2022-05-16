import { Chat, ChatMember } from '@workquest/database-models/lib/models';
import { error } from "../../../utils";
import { Errors } from "../../../utils/errors";
import chat from "../../../routes/v1/chat";

export class GroupChatAccessPermission {
  public MemberHasAccess(groupChat: Chat, member: ChatMember) {
    if (member.chatId !== groupChat.id) {
      throw error(Errors.Forbidden, 'User is not a member of this chat', {
        chatId: groupChat.id,
        userId: member.userId,
      });
    }
  }

  public MemberHasOwnerAccess(groupChat: Chat, member: ChatMember) {
    if (groupChat.groupChat.ownerMemberId !== member.id) {
      throw error(Errors.Forbidden, 'User must be owner of this chat', {
        chatId: groupChat.id,
        userId: member.userId,
      });
    }
  }
}
