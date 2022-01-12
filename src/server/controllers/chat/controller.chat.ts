import { Chat, ChatMember, ChatType, QuestChatStatuses, User } from "@workquest/database-models/lib/models";
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

  public chatMustHaveType(type: ChatType): this {
    if (this.chat.type !== type) {
      throw error(Errors.InvalidType, "Type does not match", {});
    }

    return this;
  }

  public questChatMastHaveStatus(status: QuestChatStatuses): this {
    if (this.chat.questChat.status !== status) {
      throw error(Errors.Forbidden, "Quest chat type does not match", {
        mastHave: status,
        current: this.chat.questChat.status
      });
    }

    return this;
  }

  public chatMustHaveOwner(userId: string): this {
    if (this.chat.ownerUserId !== userId) {
      throw error(Errors.Forbidden, "User is not a owner in this chat", {});
    }

    return this;
  }

  public async usersNotExistInGroupChat(userIds: string[]): Promise<this> {
    const members = await ChatMember.unscoped().findAll({
      where: { userId: userIds, chatId: this.chat.id },
    });

    if (members.length !== 0) {
      const existsIds = userIds.filter(userId =>
        members.findIndex(member => userId === member.userId) !== -1
      );

      throw error(Errors.AlreadyExists, 'Users already exists in group chat', { existsIds });
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
