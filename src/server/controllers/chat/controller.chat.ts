import { Op, Transaction } from "sequelize";
import {
  RawMember,
  CreateGroupChatPayload,
  CreateQuestChatPayload,
  SendMessageToChatPayload,
  SendInfoMessageToChatPayload,
  FindOrCreatePrivateChatPayload,
  BulkSendInfoMessageToChatPayload,
} from './types';
import {
  Chat,
  User,
  Media,
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
  QuestChatStatus,
  QuestsResponseType,
  ChatMemberDeletionData,
  ReasonForRemovingFromChat,
} from '@workquest/database-models/lib/models';

/**

abstract class ChatHelper {
  public abstract group-chat: Chat;

  static async chatMustExists(chatId: string) {
    if (!(await Chat.findByPk(chatId))) {
      throw error(Errors.NotFound, 'Chat does not exist', { chatId });
    }
  }

  public async chatMustHaveMember(userId: string) {
    const member = await ChatMember.findOne({
      where: { chatId: this.group-chat.id, userId },
    });

    if (!member) {
      throw error(Errors.Forbidden, 'User is not a member of this group-chat', {});
    }
  }

  public chatMustHaveType(type: ChatType): this {
    if (this.group-chat.type !== type) {
      throw error(Errors.InvalidType, 'Type does not match', {});
    }

    return this;
  }

  public questChatMastHaveStatus(status: QuestChatStatuses): this {
    if (this.group-chat.questChat.status !== status) {
      throw error(Errors.Forbidden, 'Quest group-chat type does not match', {
        mastHave: status,
        current: this.group-chat.questChat.status,
      });
    }

    return this;
  }

  public chatMustHaveOwner(memberId: string): this {
    if (this.group-chat.groupChat.ownerMemberId !== memberId) {
      throw error(Errors.Forbidden, 'User is not a owner in this group-chat', {});
    }

    return this;
  }

  public async usersNotExistInGroupChat(userIds: string[]): Promise<this> {
    const members = await ChatMember.unscoped().findAll({
      where: { userId: userIds, chatId: this.group-chat.id },
    });

    const membersIds = members.map(member => { return member.id });

    const membersData = await ChatMemberData.unscoped().findAll({
      where: { chatMemberId: membersIds },
    });

    if (membersData.length !== 0) {
      const existingMembers = members.filter((member) => (membersIds.findIndex((memberId) => member.id === memberId) !== -1));
      const existingUsersIds = existingMembers.map(member => member.userId);
      throw error(Errors.AlreadyExists, 'Users already exists in group group-chat', { existingUsersIds });
    }

    return this;
  }
}

export class ChatController extends ChatHelper {
  constructor(public group-chat: Chat) {
    super();

    if (!group-chat) {
      throw error(Errors.NotFound, 'Chat not found', {});
    }
  }

  static async createGroupChat(userIds: string[], name, ownerUserId, transaction?: Transaction): Promise<ChatController> {
    const group-chat = await Chat.create({ type: ChatType.group }, { transaction });
    const chatController = new ChatController(group-chat);
    const chatMembers = await chatController.createChatMembers(userIds, group-chat.id, transaction);
    const ownerChatMember = chatMembers.find(member => member.userId === ownerUserId);
    await GroupChat.create({ name, ownerMemberId: ownerChatMember.id, chatId: group-chat.id }, { transaction });
    group-chat.setDataValue('members', chatMembers);
    return chatController;
  }

  static async createQuestChat(employerId, workerId, questId, responseId, transaction?: Transaction) {
    const group-chat = await Chat.create({ type: ChatType.quest }, { transaction });
    const chatController = new ChatController(group-chat);
    const chatMembers = await chatController.createChatMembers([employerId, workerId], group-chat.id, transaction);
    const employerMemberId = chatMembers.find(member => member.userId === employerId).id;
    const workerMemberId = chatMembers.find(member => member.userId === workerId).id;
    await QuestChat.create({ employerMemberId, workerMemberId, questId, responseId, chatId: group-chat.id }, { transaction });
    group-chat.setDataValue('members', chatMembers);
    return chatController;
  }

  static async findOrCreatePrivateChat(senderUserId: string, recipientUserId: string, transaction?: Transaction): Promise<{ controller: ChatController, isCreated: boolean }> {
    try {
      const [group-chat, isCreated] = await Chat.findOrCreate({
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
      const controller = new ChatController(group-chat);
      if (isCreated) {
        const chatMembers = await controller.createChatMembers([senderUserId, recipientUserId],group-chat.id, transaction)
        group-chat.setDataValue('members', chatMembers);
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
        throw error(Errors.Forbidden, 'User already not a member of this group-chat', {});
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

  private _lastMessage: Message;

  protected setLastMessage(message: Message) {
    this._lastMessage = message;
  }

  public async getLastMessage(options: { tx?: Transaction } = {}): Promise<Message> {
    if (this._lastMessage) {
      return this._lastMessage;
    }

    const message = await Message.findOne({
      where: { chatId: this.chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });

    this.setLastMessage(message);

    return message;
  }

  public firstMessage(): Promise<Message> {
    return Message.findOne({
      where: { chatId: this.chat.id },
      order: [['number', 'ASC']],
    });
  }

  public getUserMember(userMember: User): Promise<ChatMember> {
    return ChatMember.findOne({
      where: {
        chatId: this.chat.id,
        userId: userMember.id,
      },
    });
  }

  public getMembers(options: { statuses: MemberStatus[] } = { statuses: [MemberStatus.Active] }): Promise<Readonly<ChatMember>[]> {
    return ChatMember.findAll({
      where: {
        chatId: this.chat.id,
        status: options.statuses
      },
      include: {
        model: ChatMemberDeletionData,
        as: 'chatMemberDeletionData',
      }
    });
  }

  public async sendMessage(payload: SendMessageToChatPayload, options: { tx?: Transaction } = {}): Promise<Message> {
    const lastMessage = await this.getLastMessage(options);

    const message = await Message.create({
      number: lastMessage.number + 1,
      chatId: this.chat.id,
      senderMemberId: payload.senderMember.id,
      type: MessageType.Message,
      text: payload.text,
    }, { transaction: options.tx });

    this.setLastMessage(message);

    await Promise.all([
      ChatData.update({ lastMessageId: message.id }, {
        where: { chatId: this.chat.id },
        transaction: options.tx,
      }),
      message.$set('medias', payload.medias as Media[],  {
        transaction: options.tx,
      }),
    ]);

    return message;
  }

  protected async sendInfoMessage(payload: SendInfoMessageToChatPayload, options: { tx?: Transaction }): Promise<[message: Message, infoMessage: InfoMessage]> {
    const lastMessage = await this.getLastMessage(options);

    const messageBuild = Message.build({
      senderMemberId: payload.senderMember.id,
      chatId: this.chat.id,
      type: MessageType.Info,
      number: lastMessage.number + 1,
      createdAt: Date.now(),
    });
    const infoMessageBuild = InfoMessage.build({
      messageId: messageBuild.id,
      memberId: payload.infoMessageMember.id,
      messageAction: payload.action,
    });

    const [message, infoMessage] = await Promise.all([
      messageBuild.save({ transaction: options.tx }),
      infoMessageBuild.save({ transaction: options.tx }),
    ]);

    this.setLastMessage(message);

    return [message, infoMessage];
  }

  protected async bulkSendInfoMessages(payload: BulkSendInfoMessageToChatPayload, options: { tx?: Transaction }): Promise<[message: Message, infoMessage: InfoMessage]> {
    const lastMessage = await this.getLastMessage(options);

    const messages: Message[] = [];
    const infoMessages: InfoMessage[] = [];

    for (const payload of payloads) {

    }

    const messageBuild = Message.build({
      senderMemberId: payload.senderMember.id,
      chatId: this.chat.id,
      type: MessageType.Info,
      number: lastMessage.number + 1,
      createdAt: Date.now(),
    });
    const infoMessageBuild = InfoMessage.build({
      messageId: messageBuild.id,
      memberId: payload.infoMessageMember.id,
      messageAction: payload.action,
    });

    const [message, infoMessage] = await Promise.all([
      messageBuild.save({ transaction: options.tx }),
      infoMessageBuild.save({ transaction: options.tx }),
    ]);

    this.setLastMessage(message);

    return [message, infoMessage];
  }
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
    return this.questChat.update({ status: QuestChatStatus.Close }, { transaction: options.tx });
  }

  public async sendInfoMessageAboutAcceptInvite(options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: this.members.worker,
      infoMessageMember: this.members.employer,
      action: MessageAction.WorkerAcceptInviteOnQuest,
    }, options);
  }

  public async sendInfoMessageAboutRejectInvite(options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: this.members.worker,
      infoMessageMember: this.members.employer,
      action: MessageAction.WorkerRejectInviteOnQuest,
    }, options);
  }

  public async sendInfoMessageAboutRejectResponse(options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: this.members.employer,
      infoMessageMember: this.members.worker,
      action: MessageAction.EmployerRejectResponseOnQuest,
    }, options);
  }

  static async create(payload: CreateQuestChatPayload, options: { tx?: Transaction } = {}): Promise<QuestChatController> {
    const chat = await Chat.create({ type: ChatType.Quest }, { transaction: options.tx });

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
      ? { messageAction: MessageAction.EmployerInviteOnQuest, memberId: workerChatMemberBuild.id }
      : { messageAction: MessageAction.WorkerResponseOnQuest, memberId: employerChatMemberBuild.id }

    const responseMessagePayload = payload.questResponse.type === QuestsResponseType.Invite
      ? { memberId: employerChatMemberBuild.id }
      : { memberId: workerChatMemberBuild.id }

    const firstMessageBuild = Message.build({
      senderMemberId: firstMessagePayload.senderMemberId,
      chatId: chat.id,
      type: MessageType.Info,
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
      type: MessageType.Message,
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

  public async sendInfoMessageAboutMemberRestored(memberRestored, options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: this.ownerMember,
      infoMessageMember: memberRestored,
      action: MessageAction.GroupChatMemberRestored,
    }, options);
  }

  public async sendInfoMessageAboutMemberAdded(newMember: ChatMember, options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: this.ownerMember,
      infoMessageMember: newMember,
      action: MessageAction.GroupChatAddMember,
    }, options);
  }

  public async sendInfoMessageAboutRemovedMember(remoteChatMember: ChatMember, options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: this.ownerMember,
      infoMessageMember: remoteChatMember,
      action: MessageAction.GroupChatDeleteMember,
    }, options);
  }

  public async sendInfoMessageAboutLeaveMember(chatMemberWhoLeft: ChatMember, options: { tx?: Transaction } = {}): Promise<[message: Message, infoMessage: InfoMessage]> {
    return this.sendInfoMessage({
      senderMember: chatMemberWhoLeft,
      infoMessageMember: null,
      action: MessageAction.GroupChatLeaveMember,
    }, options);
  }

  public async leaveChat(chatMember: ChatMember, options: { tx?: Transaction } = {}) {
    const lastMessage = await this.getLastMessage(options);

    return Promise.all([
      ChatMemberDeletionData.create({
        chatMemberId: chatMember.id,
        beforeDeletionMessageId: lastMessage.id,
        reason: ReasonForRemovingFromChat.Left,
        beforeDeletionMessageNumber: lastMessage.number,
      }, { transaction: options.tx, }),

      chatMember.update({ status: MemberStatus.Deleted }, {
        where: { id: chatMember.id },
        transaction: options.tx,
      }),

      ChatMemberData.destroy({
        where: { chatMemberId: chatMember.id },
        transaction: options.tx,
      }),
    ]);
  }

  public async removeMember(chatMember: ChatMember, options: { tx?: Transaction } = {}) {
    const lastMessage = await this.getLastMessage(options);

    return Promise.all([
      ChatMemberDeletionData.create({
        chatMemberId: chatMember.id,
        beforeDeletionMessageId: lastMessage.id,
        reason: ReasonForRemovingFromChat.Removed,
        beforeDeletionMessageNumber: lastMessage.number,
      }, { transaction: options.tx, }),

      chatMember.update({ status: MemberStatus.Deleted }, {
        where: { id: chatMember.id },
        transaction: options.tx,
      }),

      ChatMemberData.destroy({
        where: { chatMemberId: chatMember.id },
        transaction: options.tx,
      }),
    ]);
  }

  public async addMembers(newRawMembers: Readonly<RawMember[]>, options: { tx?: Transaction } = {}): Promise<ChatMember[]> {
    const lastMessage = await this.getLastMessage(options);

    const membersBuild = ChatMember.bulkBuild(newRawMembers.map(m => ({
      chatId: this.chat.id,
      ...m,
    })));

    const members = await Promise.all(
      membersBuild
        .map(async member => member
          .save({ transaction: options.tx })
        )
    );

    const chatMembersDataBuild = ChatMemberData.bulkBuild(members.map(m => ({
      chatMemberId: m.id,
      unreadCountMessages: 0,
      lastReadMessageId: lastMessage.id,
      lastReadMessageNumber: lastMessage.number,
    })));

    await Promise.all(chatMembersDataBuild
      .map(async md => md
        .save({ transaction: options.tx })
      )
    );

    return members;
  }

  public async recoverDeletedMembers(deletedMembers: Readonly<ChatMember[]>, options: { tx?: Transaction } = {}): Promise<ChatMember[]> {
    const lastMessage = await this.getLastMessage(options);

    const [, members] = await ChatMember.update({
      status: MemberStatus.Active,
    }, {
      where: { id: deletedMembers.map(m => m.id) },
      transaction: options.tx,
    });

    const chatMembersDataBuild = ChatMemberData.bulkBuild(members.map(m => ({
      chatMemberId: m.id,
      unreadCountMessages: 0,
      lastReadMessageId: lastMessage.id,
      lastReadMessageNumber: lastMessage.number,
    })));

    await Promise.all(chatMembersDataBuild
      .map(async md => md
        .save({ transaction: options.tx })
      )
    );

    return members;
  }

  static async create(payload: CreateGroupChatPayload, options: { tx?: Transaction } = {}): Promise<GroupChatController> {
    const chat = await Chat.create({ type: ChatType.Group });

    const membersBuild = ChatMember.bulkBuild(payload.rawMembers.map(m => ({
      chatId: chat.id,
      ...m,
    })));

    const members = await Promise.all(
      membersBuild
        .map(async member => member
          .save({ transaction: options.tx })
        )
    );

    const ownerMember = members
      .find(m => m.userId === payload.ownerRawMember.userId || m.adminId === payload.ownerRawMember.adminId)

    const groupChat = await GroupChat.create({
      name: payload.name,
      ownerMemberId: ownerMember.id,
      chatId: chat.id,
    });

    const firstMessageBuild = await Message.create({
      senderMemberId: ownerMember.id,
      chatId: chat.id,
      type: MessageType.Info,
      number: 1 /** Because create */,
      createdAt: Date.now(),
    });

    await InfoMessage.create({
      messageId: firstMessageBuild.id,
      memberId: null,
      messageAction: MessageAction.GroupChatCreate,
    });

    const chatData = await ChatData.create({
      chatId: chat.id,
      lastMessageId: firstMessageBuild.id,
    });

    const chatMembersDataBuild = ChatMemberData.bulkBuild(members.map(m => {
      if (m.id === ownerMember.id) {
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

    return new GroupChatController(chat, groupChat, ownerMember);
  }
}

export class PrivateChatController extends ChatController {
  constructor(
    public readonly chat: Chat,
    public readonly members: { senderMember: ChatMember, recipientMember: ChatMember }
  ) {
    super(chat);
  }

  static async findOrCreate(payload: FindOrCreatePrivateChatPayload, options: { tx?: Transaction } = {}) {
    const [chat, isCreated] = await Chat.scope('privateChat').findOrCreate({
      where: { type: ChatType.Private },
      defaults: { type: ChatType.Private },
      transaction: options.tx,
      include: [{
        model: ChatMember,
        as: 'senderInPrivateChat',
        where: {
          [Op.or]: [
            { userId: payload.senderRawMember.userId },
            { adminId: payload.senderRawMember.adminId },
          ],
        },
        required: true,
      }, {
        model: ChatMember,
        as: 'recipientInPrivateChat',
        where: {
          [Op.or]: [
            { userId: payload.recipientRawMember.userId },
            { adminId: payload.recipientRawMember.adminId },
          ],
        },
        required: true,
      }],
    });

    if (!isCreated) {
      return new PrivateChatController(chat, {
        senderMember: chat.senderInPrivateChat,
        recipientMember: chat.recipientInPrivateChat,
      });
    }

    const senderMemberBuild = ChatMember.build({
      chatId: chat.id,
      ...payload.senderRawMember,
    });
    const recipientMemberBuild = ChatMember.build({
      chatId: chat.id,
      ...payload.recipientRawMember,
    });

    const senderMemberDataBuild = ChatMemberData.build({
      chatMemberId: senderMemberBuild.id,
    });
    const recipientMemberDataBuild = ChatMemberData.build({
      chatMemberId: recipientMemberBuild.id,
    });

    const [senderMember, recipientMember] = await Promise.all([
      senderMemberBuild.save({ transaction: options.tx }),
      recipientMemberBuild.save({ transaction: options.tx }),
    ]);
    await Promise.all([
      senderMemberDataBuild.save({ transaction: options.tx }),
      recipientMemberDataBuild.save({ transaction: options.tx }),
    ]);

    return new PrivateChatController(chat, {
      senderMember,
      recipientMember,
    });
  }
}
