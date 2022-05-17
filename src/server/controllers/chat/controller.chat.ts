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
