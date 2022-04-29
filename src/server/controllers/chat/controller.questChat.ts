import { Transaction } from 'sequelize';
import {
  Chat,
  User,
  Quest,
  Message,
  ChatType,
  QuestChat,
  ChatMember,
  MessageType,
  InfoMessage,
  MessageAction,
  QuestsResponse,
  QuestChatStatuses,
  QuestsResponseType,
} from '@workquest/database-models/lib/models';

export interface CreateQuestChatPayload {
  readonly worker: User;
  readonly quest: Quest;
  readonly questResponse: QuestsResponse;

  readonly message: string;
}

export class QuestChatController {
  constructor(
    public readonly chat: Chat,
    public readonly questChat: QuestChat,
  ) {
  }

  public toDto(): object {
    const chat = this.chat.toJSON();

    chat['questChat'] = this.questChat.toJSON();

    return chat;
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

  public async sendInfoMessageAboutAcceptInvite(options: { tx?: Transaction } = {}): Promise<void> {
    const lastMessage = await this.lastMessage();

    const message = Message.build({
      senderUserId: this.questChat.workerMemberId,
      chatId: this.chat.id,
      type: MessageType.info,
      number: lastMessage.number + 1,
      createdAt: Date.now(),
    });
    const infoMessage = InfoMessage.build({
      messageId: message.id,
      userId: this.questChat.employerMemberId,
      messageAction: MessageAction.workerAcceptInviteOnQuest,
    });

    return void Promise.all([
      message.save({ transaction: options.tx }),
      infoMessage.save({ transaction: options.tx }),
    ]);
  }

  public async sendInfoMessageAboutRejectInvite(options: { tx?: Transaction } = {}) {
    const lastMessage = await this.lastMessage();

    const message = Message.build({
      senderUserId: this.questChat.workerMemberId,
      chatId: this.chat.id,
      type: MessageType.info,
      number: lastMessage.number + 1,
      createdAt: Date.now(),
    });
    const infoMessage = InfoMessage.build({
      messageId: message.id,
      userId: this.questChat.employerMemberId,
      messageAction: MessageAction.workerRejectInviteOnQuest,
    });

    return void Promise.all([
      message.save({ transaction: options.tx }),
      infoMessage.save({ transaction: options.tx }),
    ]);
  }

  public async sendInfoMessageAboutRejectResponse(options: { tx?: Transaction } = {}) {
    const lastMessage = await this.lastMessage();

    const message = Message.build({
      senderUserId: this.questChat.employerMemberId,
      chatId: this.chat.id,
      type: MessageType.info,
      number: lastMessage.number + 1,
      createdAt: Date.now(),
    });
    const infoMessage = InfoMessage.build({
      messageId: message.id,
      userId: this.questChat.workerMemberId,
      messageAction: MessageAction.employerRejectResponseOnQuest,
    });

    return void Promise.all([
      message.save({ transaction: options.tx }),
      infoMessage.save({ transaction: options.tx }),
    ]);
  }

  public closeQuestChat(options: { tx?: Transaction } = {}): Promise<void> {
    return void this.questChat.update({ status: QuestChatStatuses.Close }, { transaction: options.tx });
  }

  static async create(payload: CreateQuestChatPayload, options: { tx?: Transaction } = {}): Promise<QuestChatController> {
    const workerId = payload.worker.id;
    const employerId = payload.quest.userId;

    const questId = payload.quest.id;
    const responseId = payload.questResponse.id;

    const infoMessagePayload = payload.questResponse.type === QuestsResponseType.Invite
      ? { messageAction: MessageAction.employerInviteOnQuest, userId: employerId }
      : { messageAction: MessageAction.workerResponseOnQuest, userId: workerId }

    const firstMemberPayload = payload.questResponse.type === QuestsResponseType.Invite
      ? { userId: employerId }
      : { userId: workerId }

    const secondMemberPayload = payload.questResponse.type === QuestsResponseType.Invite
      ? { userId: workerId }
      : { userId: employerId }

    const senderUserId = payload.questResponse.type === QuestsResponseType.Invite
      ? employerId
      : workerId

    const chatBuild = Chat.build({ type: ChatType.quest });

    const firstInfoMessageBuild = Message.build({
      senderUserId,
      chatId: chatBuild.id,
      type: MessageType.info,
      number: 1 /** Because create */,
      createdAt: Date.now(),
    });

    const infoMessageBuild = InfoMessage.build({
      messageId: firstInfoMessageBuild.id,
      userId: infoMessagePayload.userId,
      messageAction: infoMessagePayload.messageAction,
    });

    const responseWorkerMessageBuild = Message.build({
      senderUserId,
      chatId: chatBuild.id,
      text: payload.message,
      type: MessageType.message,
      number: 2 /** Because create */,
      createdAt: Date.now() + 100,
    });

    const questChatBuild = QuestChat.build({
      chatId: chatBuild.id,
      questId,
      workerId,
      employerId,
      responseId,
    });

    // chatBuild.lastMessageId = responseWorkerMessageBuild.id;
    // chatBuild.lastMessageDate = responseWorkerMessageBuild.createdAt;

    const [chat, questChat, ] = await Promise.all([
      chatBuild.save({ transaction: options.tx }),
      questChatBuild.save({ transaction: options.tx }),
      firstInfoMessageBuild.save({ transaction: options.tx }),
      infoMessageBuild.save({ transaction: options.tx }),
      responseWorkerMessageBuild.save({ transaction: options.tx }),
    ]);

    const membersBuild = ChatMember.bulkBuild([
      {
        unreadCountMessages: 0 /** Because created */,
        chatId: chat.id,
        userId: firstMemberPayload.userId,
        lastReadMessageId: firstInfoMessageBuild.id /** Because created,  */,
        lastReadMessageNumber: firstInfoMessageBuild.number,
      },
      {
        unreadCountMessages: 1 /** Because created */,
        chatId: chat.id,
        userId: secondMemberPayload.userId,
        lastReadMessageId: null /** Because created */,
        lastReadMessageNumber: null,
      },
    ]);

    await Promise.all([
      membersBuild[0].save({ transaction: options.tx }),
      membersBuild[1].save({ transaction: options.tx }),
    ]);

    return new QuestChatController(chat, questChat);
  }
}
