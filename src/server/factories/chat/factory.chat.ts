import {
  Chat,
  ChatType,
  GroupChat,
  ChatMember,
} from '@workquest/database-models/lib/models';

export interface BuildGroupChatPayload {
  name: string;
  ownerMember: ChatMember;
}

export class ChatBuilder {
  static buildGroupChat(payload: BuildGroupChatPayload): [Chat, GroupChat] {
    const chat = Chat.build({
      type: ChatType.Group,
    });
    const groupChat = GroupChat.build({
      chatId: chat.id,
      ownerMemberId: payload.ownerMember,
      name: payload.name,
    });

    return [chat, groupChat];
  }
}
