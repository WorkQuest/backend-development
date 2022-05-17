import { Chat, ChatMember, MemberStatus, MemberType } from '@workquest/database-models/lib/models';
import { error } from '../../../utils';
import { Errors } from '../../../utils/errors';

export class ChatMemberAccessPermission {
  public HasAccessOnChat(chat: Chat, member: ChatMember) {
    if (member.chatId !== chat.id) {
      if (member.type === MemberType.User) {
        throw error(Errors.Forbidden, 'User is not a member of this chat', {
          chatId: chat.id,
          userId: member.userId,
        });
      }
      if (member.type === MemberType.Admin) {
        throw error(Errors.Forbidden, 'Admin is not a member of this chat', {
          chatId: chat.id,
          userId: member.adminId,
        });
      }
    }
    if (member.status === MemberStatus.Deleted) {
      if (member.type === MemberType.User) {
        throw error(Errors.Forbidden, 'User is not a member of this chat', {
          chatId: chat.id,
          userId: member.userId,
        });
      }
      if (member.type === MemberType.Admin) {
        throw error(Errors.Forbidden, 'Admin is not a member of this chat', {
          chatId: chat.id,
          userId: member.adminId,
        });
      }
    }
  }
}
