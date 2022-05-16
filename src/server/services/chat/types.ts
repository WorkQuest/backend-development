import { BaseOptions } from '../types';
import { Chat, ChatMember, Media, Message } from '@workquest/database-models/lib/models';


/** Options */
export interface ChatOptions extends BaseOptions {

}

export interface ActionChatOptions extends ChatOptions {
  readonly notifyWithInfoMessage: boolean;
}


/** Chat */
export interface IChatService {
  getChat(): Chat;
  getLastMessage(options: ChatOptions): Promise<Message>;
  sendMessage(payload: SendMessagePayload, options: ChatOptions): Promise<void>;
  createMessage(payload: CreateMessagePayload, options: ChatOptions): Promise<Message>;
}

export interface CreateMessagePayload {
  readonly text?: string;

  readonly senderMember: ChatMember;
  readonly medias: ReadonlyArray<Media>;
}

export interface SendMessagePayload {
  message: Message;
}


/** Group Chat */
export interface AddMemberToGroupChatPayload {
  readonly notChatMember: ChatMember;
}

export interface CreateGroupChatPayload {
  readonly name: string;
  readonly owner: ChatMember;
  readonly members: ReadonlyArray<ChatMember>;
}

export interface DeleteMemberCommand {
  readonly member: ChatMember;
  readonly deletionInitiator: ChatMember;
}

export interface LeaveMemberPayload {
  readonly member: ChatMember;
}




