import {
  Chat,
  ChatData,
  ChatMember,
  ChatMemberData,
  ChatType,
  GroupChat,
  MemberStatus,
  MemberType,
  Message,
  QuestChatStatuses
} from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { Transaction } from "sequelize";

export interface IChatMembers {
  chatId: string,
  userId?: string,
  adminId?: string,
  type: MemberType,
  status?: MemberStatus
}

abstract class ChatHelper {
  public abstract chat: Chat;

  static async chatMustExists(chatId: string) {
    if (!(await Chat.findByPk(chatId))) {
      throw error(Errors.NotFound, 'Chat does not exist', { chatId });
    }
  }

  public async chatMustHaveMember(userId: string) {
    const member = await ChatMember.findOne({
      where: { chatId: this.chat.id, userId },
    });

    if (!member) {
      throw error(Errors.Forbidden, 'User is not a member of this chat', {});
    }
  }

  public chatMustHaveType(type: ChatType): this {
    if (this.chat.type !== type) {
      throw error(Errors.InvalidType, 'Type does not match', {});
    }

    return this;
  }

  public questChatMastHaveStatus(status: QuestChatStatuses): this {
    if (this.chat.questChat.status !== status) {
      throw error(Errors.Forbidden, 'Quest chat type does not match', {
        mastHave: status,
        current: this.chat.questChat.status,
      });
    }

    return this;
  }

  public chatMustHaveOwner(userId: string): this {
    //TODO: раскомменть
    // if (this.chat.ownerUserId !== userId) {
    //   throw error(Errors.Forbidden, 'User is not a owner in this chat', {});
    // }

    return this;
  }

  public async usersNotExistInGroupChat(userIds: string[]): Promise<this> {
    const members = await ChatMember.unscoped().findAll({
      where: { userId: userIds, chatId: this.chat.id },
    });

    if (members.length !== 0) {
      const existsIds = userIds.filter((userId) => members.findIndex((member) => userId === member.userId) !== -1);

      throw error(Errors.AlreadyExists, 'Users already exists in group chat', { existsIds });
    }

    return this;
  }
}

export class ChatController extends ChatHelper {
  constructor(public chat: Chat) {
    super();

    if (!chat) {
      throw error(Errors.NotFound, 'Chat not found', {});
    }
  }

  static async createGroupChat(userIds: string[], name, ownerUserId, transaction?: Transaction): Promise<ChatController> {
    const chat = await Chat.create({ type: ChatType.group }, { transaction });
    const chatController = new ChatController(chat);
    const chatMembers = await chatController.createChatMembers(userIds, chat.id, transaction);
    const ownerChatMemberId = chatMembers.find(member => member.userId === ownerUserId).id
    await GroupChat.create({ name, ownerId: ownerChatMemberId, chatId: chat.id }, { transaction });

    chat.setDataValue('members', chatMembers);

    return chatController;
  }

  static async createQuestChat() {

  }

  // static async findOrCreatePrivateChat(senderMemberId: string, recipientMemberId: string, transaction?: Transaction): Promise<{chat: Chat, isChatCreated: boolean}> {
  //   try {
  //     const [chat, isChatCreated] = await Chat.findOrCreate({
  //       where: { type: ChatType.private },
  //       include: [
  //         {
  //           model: ChatMember,
  //           as: 'firstMemberInPrivateChat',
  //           where: { userId: senderMemberId },
  //           required: true,
  //           attributes: [],
  //         },
  //         {
  //           model: ChatMember,
  //           as: 'secondMemberInPrivateChat',
  //           where: { userId: recipientMemberId },
  //           required: true,
  //           attributes: [],
  //         },
  //       ],
  //       defaults: {
  //         type: ChatType.private,
  //       },
  //       transaction,
  //     });
  //     if (isChatCreated) {
  //       const newChatMembers = [
  //         {
  //           chatId: chat.id,
  //           userId: senderMemberId,
  //           type: MemberType.User,
  //         },
  //         {
  //           chatId: chat.id,
  //           userId: recipientMemberId,
  //           type: MemberType.User,
  //         },
  //       ];
  //       const chatMembers = await ChatController.createChatMembers(newChatMembers, transaction)
  //       chat.setDataValue('members', chatMembers);
  //     }
  //     const controller = new ChatController(chat)
  //     return controller;
  //   } catch (error) {
  //     if(transaction) {
  //       await transaction.rollback();
  //     }
  //     throw error;
  //   }
  //
  // }

  public async createChatMembers(usersIds: string[], chatId, transaction?: Transaction): Promise<ChatMember[]> {
    try {
      const chatMembers = usersIds.map((userId) => {
        return {
          userId,
          chatId,
          type: MemberType.User,
        };
      });
      return await ChatMember.bulkCreate(chatMembers, { transaction });
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createChatMembersData(chatMembers: ChatMember[], senderMemberId: string, message: Message, transaction?: Transaction) {
    try {
      const chatMembersData = chatMembers.map(member => {
        return {
          chatMemberId: member.id,
          unreadCountMessages: member.userId === senderMemberId ? 0 : 1,
          lastReadMessageId: member.userId === senderMemberId ? message.id : null,
          lastReadMessageNumber: member.userId === senderMemberId ? message.number : null,
        }
      });
      await ChatMemberData.bulkCreate(chatMembersData, { transaction });
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createChatData(chatId: string, messageId: string, transaction?: Transaction) {
    try {
      await ChatData.create({
        chatId: chatId,
        lastMessageId: messageId,
      }, { transaction });
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }


}
