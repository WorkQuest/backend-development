import { Chat, ChatMember } from '@workquest/database-models/lib/models';
import { error } from "../../../utils";
import { Errors } from "../../../utils/errors";

export class ChatMemberValidator {
  public NotNull(chat: Chat, member: ChatMember) {
    if (!chat.members.includes(member)) {
      throw error(Errors.Forbidden, 'User is not a member of this chat', {
        chatId: chat.id,
        userId: member.userId,
      });
    }
  }
}
