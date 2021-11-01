import { Chat, ChatMember, ChatType } from "@workquest/database-models/lib/models";
import { Transaction } from "sequelize";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";

abstract class CheckList {
  public readonly abstract chat: Chat;

  protected abstract _rollbackTransaction();

  static async chatMustExists(chatId: string) {
    if (!await Chat.findByPk(chatId)) {
      throw error(Errors.NotFound, "Chat does not exist", { chatId });
    }
  }

  async chatMustHaveMember(userId: string) {
    const member = await ChatMember.findOne({
      where: { chatId: this.chat.id, userId }
    });

    if (!member) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "User is not a member of this chat", {});
    }
  }

  async chatMustHaveType(type: ChatType) {

    if (this.chat.type !== type) {
      await this._rollbackTransaction();

      throw error(Errors.InvalidType, "Type does not match", {});
    }
  }

  async chatMustHaveOwner(userId: String) {
    if (this.chat.ownerUserId !== userId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "User is not a owner in this chat", {});
    }
  }
}

export class ChatController extends CheckList {
  public readonly chat: Chat;

  protected _transaction: Transaction;

  constructor(chat: Chat, transaction?: Transaction) {
    super();

    this.chat = chat;

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

export class ChatControllerFactory {
  public static async makeControllerByModel(chat: Chat, transaction?: Transaction): Promise<ChatController> {
    if (!chat) {
      if (transaction) {
        await transaction.rollback();
      }

      throw error(Errors.NotFound, "Chat not found", {});
    }

    return new ChatController(chat, transaction);
  }
}
