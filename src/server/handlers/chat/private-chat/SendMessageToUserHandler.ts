import { IHandler, Options } from '../../types';
import {
  Chat,
  User,
  Media,
  Message,
  ChatType,
  ChatMember,
  MemberType,
  MessageType,
  MemberStatus,
  ChatMemberData,
} from '@workquest/database-models/lib/models';

export interface SendMessageToUserCommand {
  readonly text: string;
  readonly sender: User;
  readonly recipient: User;
  readonly medias: ReadonlyArray<Media>;
}

export interface FindOrCreatePrivateUserChatPayload extends SendMessageToUserCommand {

}

export interface AddP2PMembersPayload extends SendMessageToUserCommand {
  readonly privateChat: Chat;
}

export interface SendMessageToMemberPayload {
  readonly text: string;
  readonly privateChat: Chat;
  readonly sender: ChatMember;
  readonly recipient: ChatMember;
  readonly lastMessage?: Message;
  readonly medias: ReadonlyArray<Media>;
}

export class SendMessageToUserHandler implements IHandler<SendMessageToUserCommand, Promise<Message>> {
  constructor(
    private readonly dbContext: any,
  ) {
  }

  private static async addP2PMembers(payload: AddP2PMembersPayload, options: Options = {}): Promise<[sender: ChatMember, recipient: ChatMember]> {
    const sender = ChatMember.build({
      chatId: payload.privateChat.id,
      userId: payload.sender.id,
      type: MemberType.User,
      status: MemberStatus.Active,
    });
    const recipient = ChatMember.build({
      chatId: payload.privateChat.id,
      userId: payload.recipient.id,
      type: MemberType.User,
      status: MemberStatus.Active,
    });

    const membersData = ChatMemberData.bulkBuild([{
      chatMemberId: sender.id,
      chatId: payload.privateChat.id,
      unreadCountMessages: 0,
      lastReadMessageId: null,
      lastReadMessageNumber: null,
    }, {
      chatMemberId: recipient.id,
      chatId: payload.privateChat.id,
      unreadCountMessages: 1,
      lastReadMessageId: null,
      lastReadMessageNumber: null,
    }]);

    await Promise.all([
      sender.save({ transaction: options.tx }),
      recipient.save({ transaction: options.tx }),
    ]);
    await Promise.all(
      membersData.map(async member => member.save({ transaction: options.tx }))
    );

    return [sender, recipient];
  }

  private static async sendMessage(payload: SendMessageToMemberPayload, options: Options = {}) {
    const message = await Message.create({
      chatId: payload.privateChat.id,
      number: payload.lastMessage.number++,
      senderMemberId: payload.sender.id,
      type: MessageType.Message,
      text: payload.text,
    }, { transaction: options.tx });

    await message.$set('medias', payload.medias as Media[], { transaction: options.tx });

    return message;
  }

  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  public static findOrCreatePrivateChat(payload: FindOrCreatePrivateUserChatPayload, options: Options = {}): Promise<[chat: Chat, isCreated: boolean]> {
    return Chat.scope('privateChat').findOrCreate({
      where: { type: ChatType.Private },
      defaults: { type: ChatType.Private },
      transaction: options.tx,
      include: [{
        model: ChatMember,
        as: 'senderInPrivateChat',
        where: { userId: payload.sender.id },
        required: true,
      }, {
        model: ChatMember,
        as: 'recipientInPrivateChat',
        where: { userId: payload.recipient.id },
        required: true,
      }],
    });
  }

  public async Handle(command: SendMessageToUserCommand): Promise<Message> {
    return await this.dbContext.transaction(async (tx) => {
      const [privateChat, isCreated] = await SendMessageToUserHandler.findOrCreatePrivateChat({ ...command }, { tx });

      if (isCreated) {
        const [sender, recipient] = await SendMessageToUserHandler.addP2PMembers({ ...command, privateChat }, { tx });

        const payload: SendMessageToMemberPayload = { ...command, sender, recipient, privateChat }

        return SendMessageToUserHandler.sendMessage(payload, { tx });
      } else {
        const lastMessage = await SendMessageToUserHandler.getLastMessage(privateChat, { tx });

        const payload: SendMessageToMemberPayload = {
          ...command,
          privateChat,
          sender: privateChat.senderInPrivateChat,
          recipient: privateChat.recipientInPrivateChat,
        }

        return SendMessageToUserHandler.sendMessage(payload, { tx });
      }
    });
  }
}