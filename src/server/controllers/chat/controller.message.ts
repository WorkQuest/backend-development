import { Message } from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { Transaction } from "sequelize";

abstract class CheckList {
  public readonly abstract message: Message;

  protected abstract _rollbackTransaction();

  async messageMustBeSender(userId: String) {
    if (this.message.senderUserId !== userId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "User isn't sender of the message", {
        messageId: this.message.id,
      });
    }
  }

  async messageMustBeChat(chatId: String) {
    if (this.message.chatId !== chatId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "This message not from this chat", {});
    }
  }
}

export class MessageController extends CheckList {
  public readonly message: Message;

  protected _transaction: Transaction;

  constructor(message: Message, transaction?: Transaction) {
    super();

    this.message = message;

    if (transaction) {
      this.setTransaction(transaction);
    }
  }

  protected _rollbackTransaction(): Promise<void> {
    if (this._transaction) return this._transaction.rollback();
  }

  public setTransaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}

export class MessageControllerFactory {
  public static async makeControllerByModel(message: Message, transaction?: Transaction): Promise<MessageController> {
    if (!message) {
      if (transaction) {
        await transaction.rollback();
      }

      throw error(Errors.NotFound, "Message not found", {});
    }

    return new MessageController(message, transaction);
  }
}
