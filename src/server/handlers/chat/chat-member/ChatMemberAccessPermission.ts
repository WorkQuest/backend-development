import { Chat, ChatMember, MemberStatus } from "@workquest/database-models/lib/models";
import { error } from "../../../utils";
import { Errors } from "../../../utils/errors";

export class ChatMemberAccessPermission {
  public HasAccessOnChat(chat: Chat, member: ChatMember) {
    if (member.chatId !== chat.id) {
      throw error(Errors.Forbidden, 'User is not a member of this chat', {
        chatId: chat.id,
        userId: member.userId,
      });
    }

    if (member.status === MemberStatus.Deleted) {
      throw error(Errors.Forbidden, 'User is not a member of this chat', {
        chatId: chat.id,
        userId: member.userId,
      });
    }
  }
}
