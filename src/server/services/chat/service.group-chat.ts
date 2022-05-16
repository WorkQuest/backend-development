import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import { ChatService } from './service.chat';
import { ChatMemberService } from './service.member';
import { ChatBuilder } from '../../factories/chat/factory.chat';
import { GroupChatValidatorService } from './service.chat-validator';
import { ChatMessageBuilder } from '../../factories/chat/factory.message';
import {
  Chat,
  Message,
  ChatMember,
  MemberStatus,
  MessageAction,
  ChatMemberDeletionData,
  ReasonForRemovingFromChat,
} from '@workquest/database-models/lib/models';
import {
  ChatOptions,
  ActionChatOptions,
  LeaveMemberPayload,
  DeleteMemberCommand,
  CreateGroupChatPayload,
  AddMemberToGroupChatPayload,
} from './types';


export class GroupChatService extends ChatService {

  public readonly chatMemberService: ChatMemberService;
  public readonly validatorService: GroupChatValidatorService;

  constructor(
    protected readonly chat: Chat,
  ) {
    super(chat);

    this.chatMemberService = new ChatMemberService(chat);
    this.validatorService = new GroupChatValidatorService(chat);
  }

  public getOwnerMember(): ChatMember {
    return this.chat.groupChat.ownerMember;
  }

  public getChat(): Chat {
    return this.chat;
  }

  protected async sendInfoMessageAboutRestoreMember(restoredMember: ChatMember, options: ChatOptions): Promise<Message> {
    const infoMessage = ChatMessageBuilder.buildInfoMessage({
      chat: this.chat,
      // number: number,
      action: MessageAction.GroupChatMemberRestored,
      author: this.chat.groupChat.ownerMember,
      heroOfOccasion: restoredMember,
    });

    infoMessage.number = (await this.getLastMessage(options)).number + 1;

    await Promise.all([
      infoMessage.save({ transaction: options.tx }),
      infoMessage.infoMessage.save({ transaction: options.tx }),
    ]);

    this.lastMessage = infoMessage;

    return infoMessage;
  }

  protected async sendInfoMessageAboutAddMember(addedMember: ChatMember, options: ChatOptions): Promise<Message> {
    const infoMessage = ChatMessageBuilder.buildInfoMessage({
      chat: this.chat,
      // number: number,
      action: MessageAction.GroupChatAddMember,
      author: this.chat.groupChat.ownerMember,
      heroOfOccasion: addedMember,
    });

    infoMessage.number = (await this.getLastMessage(options)).number + 1;

    await Promise.all([
      infoMessage.save({ transaction: options.tx }),
      infoMessage.infoMessage.save({ transaction: options.tx }),
    ]);

    this.lastMessage = infoMessage;

    return infoMessage;
  }

  protected async sendInfoMessageAboutGroupChatCreate(options: ChatOptions): Promise<Message> {
    const infoMessage = ChatMessageBuilder.buildInfoMessage({
      chat: this.chat,
      // number: number,
      action: MessageAction.GroupChatCreate,
      author: this.chat.groupChat.ownerMember,
      heroOfOccasion: null,
    });

    if (!await this.getLastMessage(options)) {
      infoMessage.number = 1;
    } else {
      infoMessage.number = (await this.getLastMessage(options)).number + 1;
    }

    await Promise.all([
      infoMessage.save({ transaction: options.tx }),
      infoMessage.infoMessage.save({ transaction: options.tx }),
    ]);

    this.lastMessage = infoMessage;

    return infoMessage;
  }

  protected async sendInfoMessageAboutDeleteMember(member: ChatMember, options: ChatOptions): Promise<Message> {
    const infoMessage = ChatMessageBuilder.buildInfoMessage({
      chat: this.chat,
      // number: number,
      action: MessageAction.GroupChatDeleteMember,
      author: this.chat.groupChat.ownerMember,
      heroOfOccasion: member,
    });

    if (!await this.getLastMessage(options)) {
      infoMessage.number = 1;
    } else {
      infoMessage.number = (await this.getLastMessage(options)).number + 1;
    }

    await Promise.all([
      infoMessage.save({ transaction: options.tx }),
      infoMessage.infoMessage.save({ transaction: options.tx }),
    ]);

    this.lastMessage = infoMessage;

    return infoMessage;
  }

  protected async sendInfoMessageAboutLeaveMember(member: ChatMember, options: ChatOptions): Promise<Message> {
    const infoMessage = ChatMessageBuilder.buildInfoMessage({
      chat: this.chat,
      // number: number,
      action: MessageAction.GroupChatLeaveMember,
      author: member,
      heroOfOccasion: null,
    });

    if (!await this.getLastMessage(options)) {
      infoMessage.number = 1;
    } else {
      infoMessage.number = (await this.getLastMessage(options)).number + 1;
    }

    await Promise.all([
      infoMessage.save({ transaction: options.tx }),
      infoMessage.infoMessage.save({ transaction: options.tx }),
    ]);

    this.lastMessage = infoMessage;

    return infoMessage;
  }

  protected async restoreMember(remoteMember: ChatMember, options: ActionChatOptions): Promise<Message | null> {
    await Promise.all([
      remoteMember.update({ status: MemberStatus.Active }, { transaction: options.tx }),
      remoteMember.chatMemberDeletionData.destroy({ transaction: options.tx }),
    ]);

    if (options.notifyWithInfoMessage) {
      return this.sendInfoMessageAboutRestoreMember(remoteMember, options);
    }

    return null;
  }

  protected async addNewMember(newMember: ChatMember, options: ActionChatOptions): Promise<Message | null> {
    newMember.chatId = this.chat.id;
    newMember.status = MemberStatus.Active;

    await newMember.save({ transaction: options.tx });

    if (options.notifyWithInfoMessage) {
      return this.sendInfoMessageAboutAddMember(newMember, options);
    }

    return null;
  }

  public async deleteMember(command: DeleteMemberCommand, options: ActionChatOptions): Promise<Message | null> {
    const lastMessage = await this.getLastMessage(options);

    const chatMemberDeletionData = ChatMemberDeletionData.build({
      chatMemberId: command.member.id,
      beforeDeletionMessageId: lastMessage?.id,
      reason: ReasonForRemovingFromChat.Removed,
      beforeDeletionMessageNumber: lastMessage?.number,
    });

    await Promise.all([
      command.member.update({ status: MemberStatus.Deleted }, { transaction: options.tx }),
      chatMemberDeletionData.save({ transaction: options.tx }),
    ]);

    if (options.notifyWithInfoMessage) {
      return this.sendInfoMessageAboutDeleteMember(command.member, options);
    }

    return null;
  }

  public async leaveChat(payload: LeaveMemberPayload, options: ActionChatOptions): Promise<Message | null> {
    const lastMessage = await this.getLastMessage(options);

    const chatMemberDeletionData = ChatMemberDeletionData.build({
      chatMemberId: payload.member.id,
      beforeDeletionMessageId: lastMessage?.id,
      reason: ReasonForRemovingFromChat.Left,
      beforeDeletionMessageNumber: lastMessage?.number,
    });

    await Promise.all([
      payload.member.update({ status: MemberStatus.Deleted }, { transaction: options.tx }),
      chatMemberDeletionData.save({ transaction: options.tx }),
    ]);

    if (options.notifyWithInfoMessage) {
      return this.sendInfoMessageAboutLeaveMember(payload.member, options);
    }

    return null;
  }

  public async addMember(payload: AddMemberToGroupChatPayload, options: ActionChatOptions): Promise<[boolean, Message | null]> {
    if (
      payload.notChatMember.status === MemberStatus.Deleted &&
      payload.notChatMember.chatMemberDeletionData.reason === ReasonForRemovingFromChat.Removed
    ) {
      return [
        true,
        await this.restoreMember(payload.notChatMember, options),
      ];
    }
    if (
      payload.notChatMember.status === MemberStatus.Deleted &&
      payload.notChatMember.chatMemberDeletionData.reason === ReasonForRemovingFromChat.Left
    ) {
      return [false, null];
    }
    if (payload.notChatMember.chatId === this.chat.id) {
      return [true, null];
    }

    return [
      true,
      await this.addNewMember(payload.notChatMember, options),
    ]
  }

  static async create(payload: CreateGroupChatPayload, options: ActionChatOptions): Promise<[GroupChatService, Message | null]> {
    const [chat, groupChat] = ChatBuilder.buildGroupChat({
      name: payload.name,
      ownerMember: payload.owner,
    });

    payload.owner.chatId = chat.id;
    payload.owner.status = MemberStatus.Active;

    groupChat.ownerMemberId = payload.owner.id;

    await Promise.all([
      chat.save({ transaction: options.tx }),
      payload.owner.save({ transaction: options.tx }),
      groupChat.save({ transaction: options.tx }),
    ]);

    const groupChatService = new GroupChatService(
      await Chat.scope('groupChat').findByPk(chat.id, { transaction: options.tx }),
    );

    for (const member of payload.members) {
      if (member.id === payload.owner.id) {
        continue;
      }

      await groupChatService.addMember({
        notChatMember: member,
      }, { ...options, notifyWithInfoMessage: false });
    }

    if (options.notifyWithInfoMessage) {
      return [
        groupChatService,
        await groupChatService.sendInfoMessageAboutGroupChatCreate(options),
      ];
    }

    return [
      groupChatService,
      null,
    ];
  }

  static async findById(id: string): Promise<GroupChatService | null> {
    const chat = await Chat.scope('groupChat').findByPk(id);

    const groupChatService = new GroupChatService(chat);

    groupChatService
      .validatorService
      .validateGroupChat()

    return groupChatService;
  }
}
