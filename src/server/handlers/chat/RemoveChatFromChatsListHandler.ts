import { BaseDomainHandler, IHandler, Options } from "../types";
import { Chat, ChatDeletionData, ChatMember, Message } from "@workquest/database-models/lib/models";

export interface RemoveChatFromChatsListCommand {
  readonly chat: Chat;
  readonly meMember: ChatMember;
}

export interface RemoveChatFromChatsListPayload extends RemoveChatFromChatsListCommand {
  readonly lastMessage: Message;
}

export class RemoveChatFromChatsListHandler extends BaseDomainHandler<RemoveChatFromChatsListCommand, Promise<void>> {
  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  private static async removeChat(payload: RemoveChatFromChatsListPayload, options: Options = {}) {
    const [ chatDeletionData, isCreated ] = await ChatDeletionData.findOrCreate({
      where: {
        chatMemberId: payload.meMember.id,
        chatId: payload.chat.id,
      },
      defaults: {
        chatMemberId: payload.meMember.id,
        chatId: payload.chat.id,
        beforeDeletionMessageId: payload.lastMessage.id,
        beforeDeletionMessageNumber: payload.lastMessage.number,
      },
      transaction: options.tx
    });

    if (!isCreated) {
      await chatDeletionData.update({
        beforeDeletionMessageId: payload.lastMessage.id,
        beforeDeletionMessageNumber: payload.lastMessage.number,
      }, { transaction: options.tx });
    }
  }

  public async Handle(command: RemoveChatFromChatsListCommand): Promise<void> {
    const lastMessage = await RemoveChatFromChatsListHandler.getLastMessage(command.chat, { tx: this.options.tx });

    const payload: RemoveChatFromChatsListPayload = { ...command, lastMessage };

    await RemoveChatFromChatsListHandler.removeChat(payload, { tx: this.options.tx });
  }
}
