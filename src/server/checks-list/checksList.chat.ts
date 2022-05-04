import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  User,
  Chat,
  ChatType,
  QuestChat,
  ChatMember,
  QuestChatStatuses,
  ChatMemberDeletionData,
} from '@workquest/database-models/lib/models';
import { GroupChat } from '@workquest/database-models/src/models/chats/GroupChat';

export class ChecksListChat {
  constructor(
    protected readonly chat: Chat,
  ) {
  }

  public async checkUserMemberMustBeInChat(userMember: User): Promise<this> {
    const [member, memberDeletionData] = await Promise.all([
      ChatMember.findOne({
        where: {
          chatId: this.chat.id,
          userId: userMember.id,
        }
      }),
      ChatMemberDeletionData.findOne({
        include: {
          model: ChatMember,
          as: 'chatMember',
          required: true,
          where: {
            chatId: this.chat.id,
            userId: userMember.id,
          },
        },
      }),
    ]);

    if (!member) {
      throw error(Errors.Forbidden, 'User is not a member of this chat', {
        chatId: this.chat.id,
        userId: userMember.id,
      });
    }
    if (memberDeletionData) {
      throw error(Errors.Forbidden, 'User has been removed from this chat', {
        chatId: this.chat.id,
        userId: userMember.id,
      });
    }

    return this;
  }

  public async checkChatMustHaveMember(userId: string) {
    const member = await ChatMember.unscoped().findOne({
      where: { chatId: this.chat.id, userId },
    });

    if (!member) {
      throw error(Errors.Forbidden, 'User is not a member of this chat', {});
    }
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

  public checkQuestChatMastHaveStatus(status: QuestChatStatuses): this {
    if (this.questChat.status !== status) {
      throw error(Errors.Forbidden, 'Quest chat type does not match', {
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

  public checkGroupChatMustHaveOwnerMember(memberId: string): this {
    if (this.groupChat.ownerMemberId !== memberId) {
      throw error(Errors.Forbidden, 'User is not a owner in this chat', {
        mastHave: memberId,
        current: this.groupChat.ownerMemberId,
      });
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

  public static checkDontSendMe(senderUserId: string, recipientUserId: string) {
    if (senderUserId === recipientUserId) {
      throw error(Errors.InvalidPayload, "You can't send a message to yourself", {});
    }
  }
}
