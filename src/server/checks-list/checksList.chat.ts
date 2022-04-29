import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  User,
  Chat,
  QuestChat,
  ChatMember,
  QuestChatStatuses,
  ChatMemberDeletionData,
} from '@workquest/database-models/lib/models';

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

  public toQuestChat(): ChecksListQuestChat {
    return new ChecksListQuestChat(this.chat);
  }
}

export class ChecksListQuestChat extends ChecksListChat {
  constructor(
    protected readonly chat: Chat,
  ) {
    super(chat);
  }

  public async checkQuestChatMastHaveStatus(status: QuestChatStatuses): Promise<this> {
    const questChat = await QuestChat.findOne({ where: { chatId: this.chat.id } });

    if (questChat.status !== status) {
      throw error(Errors.Forbidden, 'Quest chat type does not match', {
        mastHave: status,
        current: questChat.status,
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
