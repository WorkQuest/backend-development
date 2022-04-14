import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { Op, Transaction } from "sequelize";
import {
  Chat,
  ChatData,
  ChatType,
  Message,
  GroupChat,
  QuestChat,
  ChatMember,
  MemberType,
  InfoMessage,
  MessageType,
  MemberStatus,
  MessageAction,
  ChatMemberData,
  QuestChatStatuses,
  ChatMemberDeletionData,
} from "@workquest/database-models/lib/models";

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
/**TODO: исправить userId на memberId везде, где есть чаты*/
  public chatMustHaveOwner(memberId: string): this {
    if (this.chat.groupChat.ownerMemberId !== memberId) {
      throw error(Errors.Forbidden, 'User is not a owner in this chat', {});
    }

    return this;
  }

  public async usersNotExistInGroupChat(userIds: string[]): Promise<this> {
    const members = await ChatMember.unscoped().findAll({
      where: { userId: userIds, chatId: this.chat.id },
    });

    const membersIds = members.map(member => { return member.id });

    const membersData = await ChatMemberData.unscoped().findAll({
      where: { chatMemberId: membersIds },
    });

    if (membersData.length !== 0) {
      const existingMembers = members.filter((member) => (membersIds.findIndex((memberId) => member.id === memberId) !== -1));
      const existingUsersIds = existingMembers.map(member => member.userId);
      throw error(Errors.AlreadyExists, 'Users already exists in group chat', { existingUsersIds });
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
    const ownerChatMember = chatMembers.find(member => member.userId === ownerUserId);
    await GroupChat.create({ name, ownerMemberId: ownerChatMember.id, chatId: chat.id }, { transaction });
    chat.setDataValue('members', chatMembers);
    return chatController;
  }

  static async createQuestChat(employerId, workerId, questId, responseId, transaction?: Transaction) {
    const chat = await Chat.create({ type: ChatType.quest }, { transaction });
    const chatController = new ChatController(chat);
    const chatMembers = await chatController.createChatMembers([employerId, workerId], chat.id, transaction);
    const employerMemberId = chatMembers.find(member => member.userId === employerId).id;
    const workerMemberId = chatMembers.find(member => member.userId === workerId).id;
    await QuestChat.create({ employerMemberId, workerMemberId, questId, responseId, chatId: chat.id }, { transaction });
    chat.setDataValue('members', chatMembers);
    return chatController;
  }

  static async findOrCreatePrivateChat(senderUserId: string, recipientUserId: string, transaction?: Transaction): Promise<{ controller: ChatController, isCreated: boolean }> {
    try {
      const [chat, isCreated] = await Chat.findOrCreate({
        where: { type: ChatType.private },
        include: [
          {
            model: ChatMember,
            as: 'firstMemberInPrivateChat',
            where: { userId: senderUserId },
            required: true,
            attributes: [],
          },
          {
            model: ChatMember,
            as: 'secondMemberInPrivateChat',
            where: { userId: recipientUserId },
            required: true,
            attributes: [],
          },
          {
            model: ChatMember,
            as: 'members'
          },
          {
            model: ChatMember,
            as: 'meMember',
            where: { userId: senderUserId }
          }
        ],
        defaults: {
          type: ChatType.private,
        },
        transaction,
      });
      const controller = new ChatController(chat);
      if (isCreated) {
        const chatMembers = await controller.createChatMembers([senderUserId, recipientUserId],chat.id, transaction)
        chat.setDataValue('members', chatMembers);
      }
      return {controller, isCreated};
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }

  }

  public async createChatMembers(usersIds: string[], chatId, transaction?: Transaction): Promise<ChatMember[]> {
    try {
      const members = await ChatMember.findAll({ where: { chatId } });
      const existingMembers = members.filter((member) => (usersIds.findIndex((userId) => member.userId === userId) !== -1));
      const existingMembersIds = existingMembers.map(member => { return member.userId });
      const newUsersIds = [];
      usersIds.map(userId => {if (!existingMembersIds.includes(userId)) newUsersIds.push(userId) });

      const chatMembers = usersIds.map((userId) => {
        return {
          userId,
          chatId,
          type: MemberType.User,
        };
      });
      await ChatMember.update({status: MemberStatus.Active}, { where: { userId: existingMembersIds } });

      const newMembers = await ChatMember.bulkCreate(chatMembers, { transaction });
      existingMembers.push(...newMembers);
      return existingMembers;
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createChatMembersData(chatMembers: ChatMember[], senderMemberId: string, message: Message, transaction?: Transaction) {
    try {
      const chatMembersIds = chatMembers.map(member => { return member.id });
      await ChatMemberDeletionData.destroy({ where: { id: { [Op.in]: chatMembersIds } } });
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

  public async createChatMemberDeletionData(chatMemberId: string, beforeDeletionMessageId: string, beforeDeletionMessageNumber: number, transaction?: Transaction) {
    try {
      const [deletionData, isCreated] = await ChatMemberDeletionData.findOrCreate({
          where: { chatMemberId },
          defaults: { chatMemberId, beforeDeletionMessageId, beforeDeletionMessageNumber },
          transaction
      });

      if (!isCreated) {
        throw error(Errors.Forbidden, 'User already not a member of this chat', {});
      }

      await ChatMember.update({ status: MemberStatus.Deleted }, { where: {id: chatMemberId}, transaction });

      await ChatMemberData.destroy({ where: {chatMemberId: chatMemberId }, transaction });

    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createMessage(chatId: string, senderMemberId: string, messageNumber: number, text: string, transaction?: Transaction): Promise<Message> {
    try {
      return Message.create(
        {
          senderMemberId,
          chatId,
          text,
          type: MessageType.message,
          number: messageNumber,
        },
        { transaction }
      );
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createInfoMessage(senderMemberId: string, chatId: string, messageNumber: number, doingActionMemberId: string, messageAction: MessageAction, transaction?: Transaction): Promise<Message> {
    try {
      const message = await Message.create(
        {
          senderMemberId,
          chatId: chatId,
          number: messageNumber,
          type: MessageType.info,
        },
        { transaction }
      );
      const infoMessage = await InfoMessage.create({ memberId: doingActionMemberId, messageId: message.id, messageAction },{ transaction } );
      message.setDataValue('infoMessage', infoMessage);
      return message;
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }
}
