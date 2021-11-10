import { Chat, ChatMember, ChatType } from "@workquest/database-models/lib/models";
import { Transaction } from "sequelize";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { Includeable, IncludeOptions } from "sequelize/types/lib/model";
import { QuestChatStatuses } from "@workquest/database-models/src/models/chats/QuestChat";

abstract class CheckList {
  protected abstract _chat: Chat;

  protected abstract _rollbackTransaction();

  protected async _checkModel(): Promise<void | never> {
    if (!this._chat) {
      await this._rollbackTransaction();

      throw error(Errors.NotFound, "Model Chat not found", {});
    }
  }

  static async chatMustExists(chatId: string) {
    if (!await Chat.findByPk(chatId)) {
      throw error(Errors.NotFound, "Chat does not exist", { chatId });
    }
  }

  async chatMustHaveMember(userId: string) {
    await this._checkModel();

    const member = await ChatMember.findOne({
      where: { chatId: this._chat.id, userId }
    });

    if (!member) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "User is not a member of this chat", {});
    }
  }

  async chatMustHaveType(type: ChatType) {
    await this._checkModel();

    if (this._chat.type !== type) {
      await this._rollbackTransaction();

      throw error(Errors.InvalidType, "Type does not match", {});
    }
  }

  async chatMustHaveOwner(userId: String) {
    await this._checkModel();

    if (this._chat.ownerUserId !== userId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "User is not a owner in this chat", {});
    }
  }

  async questChatMastHaveStatus(status: QuestChatStatuses) {
    if (this._chat.questChat.status !== status) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "Quest chat type does not match", {
        mastHave: status,
        current: this._chat.questChat.status
      });
    }
  }
}

export class ChatController extends CheckList {
  protected readonly _chatId: string;

  protected _chat: Chat;

  protected _transaction: Transaction;

  constructor(chatId: string, chat?: Chat, transaction?: Transaction) {
    super();

    this._chatId = chatId;

    if (chat) {
      this.setModel(chat);
    }
    if (transaction) {
      this.setTransaction(transaction);
    }
  }

  protected _rollbackTransaction(): Promise<void> {
    if (this._transaction) return this._transaction.rollback();
  }

  public setModel(chat: Chat) {
    this._chat = chat;
  }

  public async findModel(include?: Includeable | Includeable[]): Promise<Chat> {
    if (this._chat) return this._chat;

    const chat = await Chat.findByPk(this._chatId, { include });

    if (!chat) {
      throw error(Errors.NotFound, "Chat not found", {
        chatId: this._chatId,
      });
    }

    this._chat = chat;

    return chat;
  }

  public setTransaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
