import { literal, Op } from 'sequelize';
import { IHandler, Options } from '../types';
import {
  Chat,
  Message,
  ChatType,
  GroupChat,
  ChatMember,
  ChatDeletionData,
} from '@workquest/database-models/lib/models';

export interface RemoveChatFromChatsListCommand {
  readonly chat: Chat;
  readonly meMember: ChatMember;
}

export interface RemoveChatFromChatsListPayload extends RemoveChatFromChatsListCommand {
  readonly lastMessage: Message;
}

export class RemoveChatFromChatsListHandler implements IHandler<RemoveChatFromChatsListCommand, Promise<Message>> {
  constructor(
    private readonly dbContext: any,
  ) {
  }

  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  private static async removeChatForAllMembers(payload: RemoveChatFromChatsListPayload, options: Options = {}) {
    await ChatDeletionData.update({
      beforeDeletionMessageId: payload.lastMessage.id,
      beforeDeletionMessageNumber: payload.lastMessage.number,
    }, {
      where: { chatId: payload.chat.id },
      transaction: options.tx,
    });

    const membersWithoutChatDeletionData = await ChatMember.unscoped().findAll({
      include: {
        model: ChatDeletionData,
        as: 'chatDeletionData',
        required: false,
      },
      where: {
        chatId: payload.chat.id,
        [Op.and]: [
          literal('"chatDeletionData->beforeDeletionMessage"."id" IS NULL'),
        ],
      },
    });

    await ChatDeletionData.bulkCreate(
      membersWithoutChatDeletionData.map(member => ({
        chatId: payload.chat.id,
        chatMemberId: member.id,
        beforeDeletionMessageId: payload.lastMessage.id,
        beforeDeletionMessageNumber: payload.lastMessage.number,
      })),
      { transaction: options.tx },
    );
  }

  private static async removeChat(payload: RemoveChatFromChatsListPayload, options: Options = {}) {
    const [ chatDeletionData, isCreated ] = await ChatDeletionData.findOrCreate({
      where: {
        chatMemberId: payload.meMember.id,
        chatId: payload.chat.id,
      },
      defaults: {
        chatMemberId: payload.meMember.id,
        chatId: payload.chat.id,
        beforeDeletionMessageId: payload.lastMessage.id,
        beforeDeletionMessageNumber: payload.lastMessage.number,
      },
      transaction: options.tx
    });

    if (!isCreated) {
      await chatDeletionData.update({
        beforeDeletionMessageId: payload.lastMessage.id,
        beforeDeletionMessageNumber: payload.lastMessage.number,
      }, { transaction: options.tx });
    }
  }

  public async Handle(command: RemoveChatFromChatsListCommand): Promise<Message> {
    return await this.dbContext.transaction(async (tx) => {
      const lastMessage = await RemoveChatFromChatsListHandler.getLastMessage(command.chat, { tx });

      const payload: RemoveChatFromChatsListPayload = { ...command, lastMessage };

      if (command.chat.type === ChatType.Group) {
        const groupChat = await GroupChat
          .unscoped()
          .findOne({ where: { chatId: payload.chat.id } })

        if (groupChat.ownerMemberId === payload.meMember.id) {
          return RemoveChatFromChatsListHandler.removeChatForAllMembers(payload, { tx });
        }
      }

      return RemoveChatFromChatsListHandler.removeChat(payload, { tx });
    });
  }
}
