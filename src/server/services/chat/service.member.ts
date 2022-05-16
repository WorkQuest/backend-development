import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import { ChatMemberBuilder } from '../../factories/chat/factory.member';
import {
  Chat,
  User,
  ChatMember,
  MemberType,
  MemberStatus,
} from '@workquest/database-models/lib/models';

export interface CreateUserMemberPayload {
  readonly user: User;
}

export class ChatMemberService {
  constructor(
    protected readonly chat: Chat,
  ) {
  }

  public getActiveChatMembers(): Promise<ChatMember[]> {
    return ChatMember.findAll({ where: { chatId: this.chat.id, status: MemberStatus.Active } });
  }

  public async getUserMembers(users: ReadonlyArray<User>): Promise<ChatMember[]> {
    const chatMembers = await ChatMember.findAll({
      where: {
        chatId: this.chat.id,
        userId: users.map(u => u.id),
      },
    });

    if (chatMembers.length !== users.length) {
      const notChatMemberUserIds = users.filter(u =>
        chatMembers.findIndex(m => u.id === m.userId) === -1
      );

      throw error(Errors.NotFound, 'Users are not members of the group-chat', { chatId: this.chat.id, notChatMemberUserIds });
    }

    return chatMembers;
  }

  public async getUserMember(user: User): Promise<ChatMember> {
    const chatMember = await ChatMember.findOne({
      where: {
        userId: user.id,
        chatId: this.chat.id,
    }});

    if (!chatMember) {
      throw error(Errors.Forbidden, 'User is not member of group-chat', {
        chatId: this.chat.id,
        userId: user.id,
      });
    }

    return chatMember;
  }

  public createUserMember(payload: CreateUserMemberPayload): ChatMember {
    return ChatMemberBuilder.buildMember({
      type: MemberType.User,
      entity: { id: payload.user.id }
    });
  }
}
