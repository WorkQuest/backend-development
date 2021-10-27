import { Chat, Message } from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { Transaction } from "sequelize";

abstract class CheckList {
  protected abstract _message: Message;

  protected abstract _rollbackTransaction();

  protected async _checkModel(): Promise<void | never> {
    if (!this._message) {
      await this._rollbackTransaction();

      throw error(Errors.NotFound, "Model Message not found", {});
    }
  }

  async messageMustBeSender(userId: String) {
    await this._checkModel();

    if (this._message.senderUserId !== userId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "User isn't sender of the message", {
        messageId: this._message.id,
      });
    }
  }

  async messageMustBeChat(chatId: String) {
    await this._checkModel();

    if (this._message.chatId !== chatId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "This message not from this chat", {});
    }
  }
}

export class MessageController extends CheckList {
  protected readonly _messageId: string;

  protected _message: Message;

  protected _transaction: Transaction;

  constructor(messageId: string, message?: Message, transaction?: Transaction) {
    super();

    this._messageId = messageId;

    if (message) {
      this.setModel(message);
    }
    if (transaction) {
      this.setTransaction(transaction);
    }
  }

  protected _rollbackTransaction(): Promise<void> {
    if (this._transaction) return this._transaction.rollback();
  }

  public setModel(message: Message) {
    this._message = message;
  }

  public async findModel(): Promise<Message> {
    if (this._message) return this._message;

    const message = await Message.findByPk(this._messageId);

    if (!message) {
      throw error(Errors.NotFound, "Chat not found", {
        messageId: this._messageId,
      });
    }

    this._message = message;

    return message;
  }

  public setTransaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
