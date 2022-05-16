import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  Chat,
  ChatMember,
  ChatType,
  GroupChat,
  MemberStatus,
  QuestChat,
  QuestChatStatus,
  ReasonForRemovingFromChat,
} from '@workquest/database-models/lib/models';

export class ChecksListChat {
  constructor(
    protected readonly chat: Chat,
  ) {
  }

  public checkChatMemberMustBeInChat(chatMember: ChatMember): this {
    if (!chatMember) {
      throw error(Errors.Forbidden, 'User/Admin is not a member of this group-chat', {
        chatId: this.chat.id,
      });
    }
    if (chatMember.status === MemberStatus.Deleted) {
      throw error(Errors.Forbidden, 'Member has been removed from this group-chat', {
        chatId: this.chat.id,
        memberId: chatMember.id,
      });
    }

    return this;
  }

  public checkChatMustHaveType(type: ChatType): this {
    if (this.chat.type !== type) {
      throw error(Errors.InvalidType, 'Chat type does not match', {
        mastHave: type,
        current: this.chat.type,
      });
    }

    return this;
  }
}

export class ChecksListQuestChat extends ChecksListChat {
  constructor(
    protected readonly chat: Chat,
    protected readonly questChat: QuestChat,
  ) {
    super(chat);
  }

  public checkQuestChatMastHaveStatus(status: QuestChatStatus): this {
    if (this.questChat.status !== status) {
      throw error(Errors.Forbidden, 'Quest group-chat type does not match', {
        mastHave: status,
        current: this.questChat.status,
      });
    }

    return this;
  }
}

export class ChecksListGroupChat extends ChecksListChat {
  constructor(
    protected readonly chat: Chat,
    protected readonly groupChat: GroupChat,
  ) {
    super(chat);
  }

  public checkMembersMustNotBeInGroupChat(entityIds: string[], members: ChatMember[]): this {
    const membersAlreadyInChat = members
      .filter(m => m.status === MemberStatus.Active && entityIds
        .some(id => m.userId === id || m.adminId === id)
      )

    if (membersAlreadyInChat.length !== 0) {
      throw error(Errors.AlreadyExists, 'Members is already in this group-chat', {
        membersAlreadyInChat: membersAlreadyInChat.map(m => ({
          id: m.id,
          type: m.type,
          userId: m.userId,
          adminId: m.adminId,
        })),
      });
    }

    return this;
  }

  public checkMembersMustHaveReasonForDeletionInGroupChat(reason: ReasonForRemovingFromChat, remoteMembers: ChatMember[]): this {
    const membersReasonDoesNotMatch = remoteMembers.filter(m => m.chatMemberDeletionData.reason !==reason);

    if (membersReasonDoesNotMatch.length !== 0) {
      throw error(Errors.Forbidden, 'Reason for deleting members does not match', {
        membersReasonDoesNotMatch: membersReasonDoesNotMatch.map(m => ({
          id: m.id,
          type: m.type,
          userId: m.userId,
          adminId: m.adminId,
        })),
      });
    }

    return this;
  }

  public checkGroupChatMustHaveOwnerChatMember(chatMember: ChatMember): this {
    if (this.groupChat.ownerMemberId !== chatMember.id) {
      throw error(Errors.Forbidden, 'Member is not a owner in this group-chat', {
        mastHave: chatMember.id,
        current: this.groupChat.ownerMemberId,
      });
    }

    return this;
  }

  public checkGroupChatNotHaveOwnerUserMember(chatMember: ChatMember): this {
    if (this.groupChat.ownerMemberId === chatMember.id) {
      throw error(Errors.Forbidden, 'User is group-chat owner', {});
    }

    return this;
  }
}

export class ChecksListPrivateChat extends ChecksListChat {
  constructor(
    protected readonly chat: Chat,
  ) {
    super(chat);
  }

  public static checkDontSendMe(senderId, recipientId) {
    if (senderId === recipientId) {
      throw error(Errors.InvalidPayload, "You can't send a message to yourself", {});
    }
  }
}

export class ChecksListChatMember {
  constructor(
    protected readonly chatMember: ChatMember,
  ) {
  }

  public checkMemberStatus(...statuses: MemberStatus[]): this | never {
    if (!statuses.includes(this.chatMember.status)) {
      throw error(Errors.InvalidStatus, "Chat member status doesn't match", {
        current: this.chatMember.status,
        mustHave: statuses,
      });
    }

    return this;
  }
}
