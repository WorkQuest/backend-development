import {
  User,
  Media,
  Quest,
  ChatMember,
  MemberType,
  MessageAction,
  QuestsResponse,
} from '@workquest/database-models/lib/models';

export type RawMember = {
  userId?: string,
  adminId?: string,

  type: MemberType,
}

export interface CreateQuestChatPayload {
  readonly worker: User;
  readonly quest: Quest;
  readonly questResponse: QuestsResponse;

  readonly message: string;
}

export interface CreateGroupChatPayload {
  readonly name: string;

  readonly ownerRawMember: RawMember;
  readonly rawMembers: Readonly<RawMember[]>;
}

export interface FindOrCreatePrivateChatPayload {
  readonly senderRawMember: RawMember;
  readonly recipientRawMember: RawMember;
}

export interface SendInfoMessageToChatPayload {
  action: MessageAction,
  senderMember: ChatMember,
  infoMessageMember: ChatMember,
}

export interface BulkSendInfoMessageToChatPayload {

}

export interface SendMessageToChatPayload {
  readonly text: string;
  readonly senderMember: ChatMember;
  readonly medias: Readonly<Media[]>;
}
