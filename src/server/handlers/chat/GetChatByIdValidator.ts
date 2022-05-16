import { Chat, ChatMember } from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";


export class GetChatByIdValidator {
  public NotNull(chat: Chat) {
    if (!chat) {
      throw error(Errors.NotFound, 'Chat is not found', {
        chatId: chat.id,
      });
    }
  }
}

