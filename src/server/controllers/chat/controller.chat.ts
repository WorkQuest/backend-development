import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { Op, Transaction } from "sequelize";
import { CreateGroupChatPayload, CreateQuestChatPayload, FindOrCreatePrivateChatPayload } from './types';
import {
  User,
  Quest,
  Chat,
  ChatData,
  ChatType,
  Message,
  UserRole,
  GroupChat,
  QuestChat,
  ChatMember,
  QuestsResponse,
  QuestsResponseType,
  MemberType,
  InfoMessage,
  MessageType,
  MemberStatus,
  MessageAction,
  ChatMemberData,
  QuestChatStatuses,
  ChatMemberDeletionData,
} from "@workquest/database-models/lib/models";

/**

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

*/

export class ChatController {
  constructor(
    public readonly chat: Chat,
  ) {
  }

  public lastMessage(): Promise<Message> {
    return Message.findOne({
      where: { chatId: this.chat.id },
      order: [['number', 'DESC']],
    });
  }

  public firstMessage(): Promise<Message> {
    return Message.findOne({
      where: { chatId: this.chat.id },
      order: [['number', 'ASC']],
    });
  }

  protected async sendInfoMessage(payload: { senderMember: ChatMember, infoMessageMember: ChatMember, action: MessageAction }, options: { tx?: Transaction }): Promise<[message: Message, infoMessage: InfoMessage]> {
    const lastMessage = await this.lastMessage();

    // TODO: добавить LOCK
    const message = Message.build({
      senderMemberId: payload.senderMember.id,
      chatId: this.chat.id,
      type: MessageType.info,
      number: lastMessage.number + 1,
      createdAt: Date.now(),
    });
    const infoMessage = InfoMessage.build({
      messageId: message.id,
      memberId: payload.infoMessageMember.id,
      messageAction: payload.action,
    });

    return Promise.all([
      message.save({ transaction: options.tx }),
      infoMessage.save({ transaction: options.tx }),
    ]);
  }

  // public addUserTo
}

export class QuestChatController extends ChatController {
  constructor(
    public readonly chat: Chat,
    public readonly questChat: QuestChat,
    public readonly members: { employer: ChatMember, worker: ChatMember },
  ) {
    super(chat);
  }

  public toDto(): object {
    const chat = this.chat.toJSON();

    chat['questChat'] = this.questChat.toJSON();

    return chat;
  }

  public closeQuestChat(options: { tx?: Transaction } = {}): Promise<any> {
    return this.questChat.update({ status: QuestChatStatuses.Close }, { transaction: options.tx });
  }

  public async sendInfoMessageAboutAcceptInvite(options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: this.members.worker,
      infoMessageMember: this.members.employer,
      action: MessageAction.workerAcceptInviteOnQuest,
    }, options);
  }

  public async sendInfoMessageAboutRejectInvite(options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: this.members.worker,
      infoMessageMember: this.members.employer,
      action: MessageAction.workerRejectInviteOnQuest,
    }, options);
  }

  public async sendInfoMessageAboutRejectResponse(options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: this.members.employer,
      infoMessageMember: this.members.worker,
      action: MessageAction.employerRejectResponseOnQuest,
    }, options);
  }

  static async create(payload: CreateQuestChatPayload, options: { tx?: Transaction } = {}): Promise<QuestChatController> {
    const chat = await Chat.create({ type: ChatType.quest }, { transaction: options.tx });

    const workerId = payload.worker.id;
    const employerId = payload.quest.userId;

    const questId = payload.quest.id;
    const responseId = payload.questResponse.id;

    const [employerChatMemberBuild, workerChatMemberBuild] = ChatMember.bulkBuild([{
      userId: employerId,
      chatId: chat.id,
      type: MemberType.User,
    }, {
      userId: workerId,
      chatId: chat.id,
      type: MemberType.User,
    }]);

    const firstMessagePayload = payload.questResponse.type === QuestsResponseType.Invite
      ? { senderMemberId: employerChatMemberBuild.id }
      : { senderMemberId: workerChatMemberBuild.id }

    const firstInfoMessagePayload = payload.questResponse.type === QuestsResponseType.Invite
      ? { messageAction: MessageAction.employerInviteOnQuest, memberId: workerChatMemberBuild.id }
      : { messageAction: MessageAction.workerResponseOnQuest, memberId: employerChatMemberBuild.id }

    const responseMessagePayload = payload.questResponse.type === QuestsResponseType.Invite
      ? { memberId: employerChatMemberBuild.id }
      : { memberId: workerChatMemberBuild.id }

    const firstMessageBuild = Message.build({
      senderMemberId: firstMessagePayload.senderMemberId,
      chatId: chat.id,
      type: MessageType.info,
      number: 1 /** Because create */,
      createdAt: Date.now(),
    });

    const firstInfoMessageBuild = InfoMessage.build({
      messageId: firstMessageBuild.id,
      memberId: firstInfoMessagePayload.memberId,
      messageAction: firstInfoMessagePayload.messageAction,
    });

    const responseMessageBuild = Message.build({
      senderMemberId: responseMessagePayload.memberId,
      chatId: chat.id,
      text: payload.message,
      type: MessageType.message,
      number: 2 /** Because create */,
      createdAt: Date.now() + 100,
    });

    const employerChatMemberDataPayload = payload.questResponse.type === QuestsResponseType.Invite
      ? { unreadCountMessages: 0, lastReadMessageId: responseMessageBuild.id, lastReadMessageNumber: responseMessageBuild.number }
      : { unreadCountMessages: 2, lastReadMessageId: null, lastReadMessageNumber: null }

    const workerChatMemberDataPayload = payload.questResponse.type === QuestsResponseType.Invite
      ? { unreadCountMessages: 2, lastReadMessageId: null, lastReadMessageNumber: null }
      : { unreadCountMessages: 0, lastReadMessageId: responseMessageBuild.id, lastReadMessageNumber: responseMessageBuild.number }

    const [employerChatMemberDataBuild, workerChatMemberDataBuild] = ChatMemberData.bulkBuild([{
      chatMemberId: employerChatMemberBuild.id,
      lastReadMessageId: employerChatMemberDataPayload.lastReadMessageId,
      unreadCountMessages: employerChatMemberDataPayload.unreadCountMessages,
      lastReadMessageNumber: employerChatMemberDataPayload.lastReadMessageNumber,
    }, {
      chatMemberId: workerChatMemberBuild.id,
      lastReadMessageId: workerChatMemberDataPayload.lastReadMessageId,
      unreadCountMessages: workerChatMemberDataPayload.unreadCountMessages,
      lastReadMessageNumber: workerChatMemberDataPayload.lastReadMessageNumber,
    }]);

    const chatDataBuild = ChatData.build({
      chatId: chat.id,
      lastMessageId: responseMessageBuild.id,
    });

    const questChatBuild = QuestChat.build({
      chatId: chat.id,
      questId,
      workerId,
      employerId,
      responseId,
    });

    const [questChat, workerChatMember, employerChatMember] = await Promise.all([
      questChatBuild.save({ transaction: options.tx }),
      workerChatMemberBuild.save({ transaction: options.tx }),
      employerChatMemberBuild.save({ transaction: options.tx }),
    ]);

    const [] = await Promise.all([
      firstMessageBuild.save({ transaction: options.tx }),
      firstInfoMessageBuild.save({ transaction: options.tx }),
      responseMessageBuild.save({ transaction: options.tx }),
    ]);

    const [] = await Promise.all([
      chatDataBuild.save({ transaction: options.tx }),
      workerChatMemberDataBuild.save({ transaction: options.tx }),
      employerChatMemberDataBuild.save({ transaction: options.tx }),
    ]);

    return new QuestChatController(chat, questChat, {
      worker: workerChatMember,
      employer: employerChatMember,
    });
  }
}

export class GroupChatController extends ChatController {
  constructor(
    public readonly chat: Chat,
    public readonly groupChat: GroupChat,
    public readonly ownerMember: ChatMember,
  ) {
    super(chat);
  }

  public getMembers(): Promise<Readonly<ChatMember>[]> {
    return ChatMember.findAll({
      where: { chatId: this.chat.id }
    });
  }

  public async toDtoResult() {
    if (!this.chat.groupChat) {
      return (await Chat.findByPk(this.chat.id))
        .toJSON()
    }
    if (!this.chat.chatData) {
      return (await Chat.findByPk(this.chat.id))
        .toJSON()
    }

    return this.chat.toJSON();
  }

  static async create(payload: CreateGroupChatPayload, options: { tx?: Transaction } = {}): Promise<GroupChatController> {
    const chat = await Chat.create({ type: ChatType.group });

    const membersBuild = ChatMember.bulkBuild(payload.users.map(user => ({
      chatId: chat.id,
      userId: user.id,
      type: MemberType.User,
    })));

    const members = await Promise.all(
      membersBuild
        .map(async member => member
          .save({ transaction: options.tx })
        )
    );

    const memberCreator = members
      .find(m => m.userId === payload.userOwner.id)

    const groupChat = await GroupChat.create({
      name: payload.name,
      ownerMemberId: memberCreator.id,
      chatId: chat.id,
    });

    const firstMessageBuild = await Message.create({
      senderMemberId: memberCreator.id,
      chatId: chat.id,
      type: MessageType.info,
      number: 1 /** Because create */,
      createdAt: Date.now(),
    });

    await InfoMessage.create({
      messageId: firstMessageBuild.id,
      memberId: null,
      messageAction: MessageAction.groupChatCreate,
    });

    const chatData = await ChatData.create({
      chatId: chat.id,
      lastMessageId: firstMessageBuild.id,
    });

    const chatMembersDataBuild = ChatMemberData.bulkBuild(members.map(m => {
      if (m.id === memberCreator.id) {
        return {
          chatMemberId: m.id,
          unreadCountMessages: 0,
          lastReadMessageId: firstMessageBuild.id,
          lastReadMessageNumber: firstMessageBuild.number,
        }
      }

      return { chatMemberId: m.id }
    }));

    await Promise.all(chatMembersDataBuild
      .map(async md => md
        .save({ transaction: options.tx })
      )
    );

    chat.setDataValue('groupChat', groupChat);
    chat.setDataValue('chatData', chatData);

    return new GroupChatController(chat, groupChat, memberCreator);
  }
}

export class PrivateChatController extends ChatController {
  constructor(
    public readonly chat: Chat,
    public readonly members: { senderMember: ChatMember, recipientMember: ChatMember }
  ) {
    super(chat);
  }

  // static async create(payload: FindOrCreatePrivateChatPayload, options: { tx?: Transaction } = {}) {
  //
  // }

  static async findOrCreate(payload: FindOrCreatePrivateChatPayload, options: { tx?: Transaction } = {}) {
    const [chat, isCreated] = await Chat.findOrCreate({
      where: { type: ChatType.private },
      include: [{
        model: ChatMember,
        as: 'firstMemberInPrivateChat',
        where: { userId: payload.senderUser.id },
        required: true,
        attributes: [],
      }, {
        model: ChatMember,
        as: 'secondMemberInPrivateChat',
        where: { userId: payload.recipientUser.id },
        required: true,
        attributes: [],
      }, {
        model: ChatMember,
        as: 'members'
      }, {
        model: ChatMember,
        as: 'meMember',
        where: { userId: payload.senderUser.id }
      }],
      defaults: { type: ChatType.private },
      transaction,
    });
  }
}
