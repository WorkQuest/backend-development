import {
  Chat,
  ChatMember,
  MemberType,
} from '@workquest/database-models/lib/models';

export interface BuildMemberPayload {
  readonly chat?: Chat;
  readonly type: MemberType;
  readonly entity: { id: string };
}

export class ChatMemberBuilder {
  private static buildUserMember(payload: BuildMemberPayload) {
    return ChatMember.build({
      chatId: payload.chat?.id,
      userId: payload.entity.id,
      type: MemberType.User,
    });
  }

  public static buildMember(payload: BuildMemberPayload): ChatMember {
    if (payload.type === MemberType.User) {
      return ChatMemberBuilder.buildUserMember(payload);
    } else if (payload.type === MemberType.Admin) {
      return ChatMember.build(); // TODO
    }
  }
}
