import { IHandler, Options } from '../types';
import { Chat, ChatDeletionData, ChatMember, Media, Message, MessageType } from "@workquest/database-models/lib/models";

export interface RemoveChatFromChatsListCommand {
  readonly chat: Chat;
  readonly meMember: ChatMember;
}

export interface RemoveChatFromChatsListPayload extends RemoveChatFromChatsListCommand {
  readonly lastMessage: Message;
}

export class RemoveChatFromChatsListHandler implements IHandler<RemoveChatFromChatsListCommand, Promise<Message>> {
  constructor(
    private readonly dbContext: any,
  ) {
  }

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
        beforeDeletionMessageId: payload.chat.chatData.lastMessageId,
        beforeDeletionMessageNumber: payload.chat.chatData.lastMessage.number,
      },
      transaction: options.tx
    });

    if (!isCreated) {
      await chatDeletionData.update({
        beforeDeletionMessageId: payload.chat.chatData.lastMessageId,
        beforeDeletionMessageNumber: payload.chat.chatData.lastMessage.number,
      }, { transaction: options.tx });
    }
  }

  public async Handle(command: RemoveChatFromChatsListCommand): Promise<Message> {
    return await this.dbContext.transaction(async (tx) => {
      const lastMessage = await RemoveChatFromChatsListHandler.getLastMessage(command.chat, { tx });

      const payload: RemoveChatFromChatsListPayload = { ...command, lastMessage };

      return await RemoveChatFromChatsListHandler.removeChat(payload, { tx });
    });
  }
}
