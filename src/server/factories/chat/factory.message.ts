import {
  Chat,
  Media,
  Message,
  ChatMember,
  InfoMessage,
  MessageType,
  MessageAction,
} from '@workquest/database-models/lib/models';

export interface BuildMessagePayload {
  readonly chat: Chat;
  readonly member: ChatMember;
  // readonly number: number;
  readonly text: string;
  readonly medias: Media[];
}

export interface BuildInfoMessagePayload {
  readonly chat: Chat;
  // readonly number: number;
  readonly action: MessageAction;
  readonly author: ChatMember;
  readonly heroOfOccasion?: ChatMember;
}

export class ChatMessageBuilder {
  public static buildMessage(payload: BuildMessagePayload): Message {
    const message =  Message.build({
      chatId: payload.chat.id,
      memberId: payload.member.id,
      // number: payload.number,
      text: payload.text,
      type: MessageType.Message,
    });

    message.set('medias', payload.medias);

    return message;
  }

  public static buildInfoMessage(payload: BuildInfoMessagePayload): Message {
    const message = Message.build({
      chatId: payload.chat.id,
      memberId: payload.author.id,
      // number: payload.number,
      text: null,
      type: MessageType.Info,
    });

    const infoMessage = InfoMessage.build({
      messageId: message.id,
      memberId: payload.heroOfOccasion.id,
      messageAction: payload.action,
    });

    message.set('infoMessage', infoMessage);

    return message;
  }
}
