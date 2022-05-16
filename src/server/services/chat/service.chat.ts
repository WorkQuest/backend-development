import { ChatMessageBuilder } from '../../factories/chat/factory.message';
import {
  Chat,
  Media,
  Message,
  ChatMember,
} from '@workquest/database-models/lib/models';
import {
  ChatOptions,
  IChatService,
  SendMessagePayload,
  CreateMessagePayload,
} from './types';

export class ChatService implements IChatService {

  private _lastMessage: Message;

  constructor(
    protected readonly chat: Chat,
  ) {
  }

  public getChat(): Chat {
    return this.chat;
  }

  protected set lastMessage(message: Message) {
    this._lastMessage = message;
  }

  public getMembers(): Promise<ChatMember[]> {
    return ChatMember.findAll({ where: { chatId: this.chat.id } });
  }

  public async createMessage(payload: CreateMessagePayload, options: ChatOptions): Promise<Message> {
    return ChatMessageBuilder.buildMessage({
      chat: this.chat,
      member: payload.senderMember,
      // number: lastMessage.number + 1,
      text: payload.text,
      medias: payload.medias as Media[],
    });
  }

  public async sendMessage(payload: SendMessagePayload, options: ChatOptions): Promise<void> {
    payload.message.number = (await this.lastMessage).number + 1;

    await payload.message.save({ transaction: options.tx });

    this.lastMessage = payload.message;
  }

  public async getLastMessage(options: ChatOptions = {}): Promise<Message> {
    if (this._lastMessage) {
      return this._lastMessage;
    }

    const message = await Message.findOne({
      where: { chatId: this.chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });

    this.lastMessage = message;

    return message;
  }
}




