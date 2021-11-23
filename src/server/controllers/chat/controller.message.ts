import { Message } from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { Transaction } from "sequelize";

abstract class MessageHelper {
  public abstract message: Message;

  async messageMustBeSender(userId: String) {
    if (this.message.senderUserId !== userId) {
      throw error(Errors.Forbidden, "User isn't sender of the message", {
        messageId: this.message.id,
      });
    }

    return this;
  }

  async messageMustBeChat(chatId: String) {
    if (this.message.chatId !== chatId) {
      throw error(Errors.Forbidden, "This message not from this chat", {});
    }

    return this;
  }
}

export class MessageController extends MessageHelper {

  constructor(
    public message: Message
  ) {
    super();

    if (!message) {
      throw error(Errors.NotFound, "Message not found", {});
    }
  }

}
