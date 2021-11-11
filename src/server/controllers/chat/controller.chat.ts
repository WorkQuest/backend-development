import { Chat, ChatMember, ChatType, QuestChatStatuses } from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";

abstract class ChatHelper {
  public abstract chat: Chat;

  static async chatMustExists(chatId: string) {
    if (!await Chat.findByPk(chatId)) {
      throw error(Errors.NotFound, "Chat does not exist", { chatId });
    }
  }

  public async chatMustHaveMember(userId: string) {
    const member = await ChatMember.findOne({
      where: { chatId: this.chat.id, userId }
    });

    if (!member) {
      throw error(Errors.Forbidden, "User is not a member of this chat", {});
    }
  }

  public chatMustHaveType(type: ChatType) {
    if (this.chat.type !== type) {
      throw error(Errors.InvalidType, "Type does not match", {});
    }

    return this;
  }

  public questChatMastHaveStatus(status: QuestChatStatuses) {
    if (this.chat.questChat.status !== status) {
      throw error(Errors.Forbidden, "Quest chat type does not match", {
        mastHave: status,
        current: this._chat.questChat.status
      });
    }

    return this;
  }
}

  public chatMustHaveOwner(userId: String) {
    if (this.chat.ownerUserId !== userId) {
      throw error(Errors.Forbidden, "User is not a owner in this chat", {});
    }

    return this;
  }
}

export class ChatController extends ChatHelper {
  constructor(
    public chat: Chat
  ) {
    super();

    if (!chat) {
      throw error(Errors.NotFound, "Chat not found", {});
    }
  }

}
