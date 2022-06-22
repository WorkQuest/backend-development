import { BaseDomainHandler, IHandler, Options } from "../types";
import { Chat, ChatMember, Media, Message, MessageType } from '@workquest/database-models/lib/models';

export interface SendMessageToChatCommand {
  readonly chat: Chat;
  readonly text: string;
  readonly sender: ChatMember;
  readonly medias: ReadonlyArray<Media>,
}

export interface SendMessageToChatPayload extends SendMessageToChatCommand {
  readonly lastMessage: Message;
}

export class SendMessageToChatHandler extends BaseDomainHandler<SendMessageToChatCommand, Promise<Message>> {
  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  private static async sendMessage(payload: SendMessageToChatPayload, options: Options = {}): Promise<Message> {
    let lastMessageNumber = 1;
    if (payload.lastMessage) {
      lastMessageNumber += payload.lastMessage.number
    }
    const message = await Message.create({
      chatId: payload.chat.id,
      number: lastMessageNumber,
      senderMemberId: payload.sender.id,
      type: MessageType.Message,
      text: payload.text,
    }, { transaction: options.tx });

    await message.$set('medias', payload.medias as Media[], { transaction: options.tx });
    message.setDataValue('medias', payload.medias as Media[]);
    message.setDataValue('sender', payload.sender);
    return message;
  }

  public async Handle(command: SendMessageToChatCommand): Promise<Message> {
    const lastMessage = await SendMessageToChatHandler.getLastMessage(command.chat, { tx: this.options.tx });
    const payload: SendMessageToChatPayload = { ...command, lastMessage };
    return await SendMessageToChatHandler.sendMessage(payload, { tx: this.options.tx });
  }
}
