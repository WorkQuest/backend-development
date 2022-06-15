import { GroupChatValidator } from './GroupChatValidator';
import { HandlerDecoratorBase, IHandler, Options } from '../../types';
import { GroupChatAccessPermission } from './GroupChatAccessPermission';
import {
  Chat,
  User,
  Message,
  ChatMember,
  MemberType,
  InfoMessage,
  MemberStatus,
  MessageAction,
  ChatMemberData,
  ChatMemberDeletionData,
  ReasonForRemovingFromChat, MessageType, Media
} from "@workquest/database-models/lib/models";

export interface AddUsersInGroupChatCommand {
  readonly groupChat: Chat;
  readonly addInitiator: ChatMember,
  readonly users: ReadonlyArray<User>;
}

interface RestoreMembersPayload {
  readonly groupChat: Chat;
  readonly lastMessage: Message;
  readonly deletedMembers: ReadonlyArray<ChatMember>;
}

interface AddUsersPayload {
  readonly groupChat: Chat;
  readonly lastMessage: Message;
  readonly newMembers: ReadonlyArray<ChatMember>;
}

export class AddUsersInGroupChatHandler implements IHandler<AddUsersInGroupChatCommand, Promise<Message[]>>{
  constructor(
    private readonly dbContext: any,
  ) {
  }

  private static async sendInfoMessagesAboutRestoreMembers(payload: RestoreMembersPayload, options: Options = {}): Promise<Message[]> {
    const messages = Message.bulkBuild(
      payload.deletedMembers.map((member, number ) => ({
        type: MessageType.Info,
        chatId: payload.groupChat.id,
        number: payload.lastMessage.number + number + 1, //cause starts from 0
        senderMemberId: payload.groupChat.groupChat.ownerMemberId,
      }))
    );
    const infoMessages = InfoMessage.bulkBuild(
      messages.map((message, number) => ({
        messageId: message.id,
        memberId: payload.deletedMembers[number].id,
        messageAction: MessageAction.GroupChatMemberRestored,
      }))
    )

    await Promise.all(
      messages.map(async message => message.save({ transaction: options.tx })),
    );
    await Promise.all(
      infoMessages.map(async infoMessage => infoMessage.save({ transaction: options.tx })),
    );

    infoMessages.forEach((infoMessage, number) =>{
      infoMessage.setDataValue('member', payload.deletedMembers[number]);
    });

    messages.forEach((message, number) => {
      message.setDataValue('infoMessage', infoMessages[number]);
    });

    return messages;
  }

  private static async sendInfoMessageAboutAddMember(payload: AddUsersPayload, options: Options = {}): Promise<Message[]> {
    const messages = Message.bulkBuild(
      payload.newMembers.map((member, number) => ({
        type: MessageType.Info,
        chatId: payload.groupChat.id,
        number: payload.lastMessage.number + number + 1, //'cause starts from 0
        senderMemberId: payload.groupChat.groupChat.ownerMemberId,
      }))
    );
    const infoMessages = InfoMessage.bulkBuild(
      messages.map((message, number) => ({
        messageId: message.id,
        memberId: payload.newMembers[number].id,
        messageAction: MessageAction.GroupChatAddMember,
      }))
    )

    await Promise.all(
      messages.map(async message => message.save({ transaction: options.tx })),
    );
    await Promise.all(
      infoMessages.map(async infoMessage => infoMessage.save({ transaction: options.tx })),
    );

    infoMessages.forEach((infoMessage, number) =>{
      infoMessage.setDataValue('member', payload.newMembers[number]);
    });

    messages.forEach((message, number) => {
      message.setDataValue('infoMessage', infoMessages[number]);
    });

    return messages;
  }

  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  private static async addMembers(payload: AddUsersPayload, options: Options = {}) {
    payload.newMembers.forEach(member => {
      member.chatId = payload.groupChat.id;
      member.status = MemberStatus.Active;
    });

    const membersData = ChatMemberData.bulkBuild(
      payload.newMembers.map(member => ({
        chatMemberId: member.id,
        chatId: payload.groupChat.id,
        unreadCountMessages: 0,
        lastReadMessageId: payload.lastMessage.id,
        lastReadMessageNumber: payload.lastMessage.number,
      }))
    );

    await Promise.all(
      payload.newMembers.map(async member => member.save({ transaction: options.tx }))
    );
    await Promise.all(
      membersData.map(async member => member.save({ transaction: options.tx }))
    );
  }

  private static async restoreMembers(payload: RestoreMembersPayload, options: Options = {}) {
    const ids = payload.deletedMembers.map(member => member.id);

    const membersData = ChatMemberData.bulkBuild(
      payload.deletedMembers.map(member => ({
        chatMemberId: member.id,
        chatId: payload.groupChat.id,
        unreadCountMessages: 0,
        lastReadMessageId: payload.lastMessage.id,
        lastReadMessageNumber: payload.lastMessage.number,
      }))
    );

    await Promise.all([
      ChatMember.update({
        status: MemberStatus.Active,
      }, {
        where: { id: ids },
        transaction: options.tx,
      }),
      ChatMemberDeletionData.destroy({
        where: { chatMemberId: ids },
        transaction: options.tx,
      }),
      membersData.map(async member => member.save({ transaction: options.tx })),
    ]);

    return null;
  }

  public async Handle(command: AddUsersInGroupChatCommand): Promise<Message[]> {
    const userIds = command.users.map(user => user.id);

    const deletedMembers = await ChatMember.findAll({
      where: {
        userId: userIds,
        chatId: command.groupChat.id,
      },
      include: [{
        model: ChatMemberDeletionData,
        as: 'chatMemberDeletionData',
        where: { reason: ReasonForRemovingFromChat.Removed },
        required: true,
      }, {
        model: User.unscoped(),
        as: 'user',
        attributes: ["firstName", "lastName", "role"],
        include: [{
          model: Media,
          as: 'avatar',
        }]
      }],
    });

    const deletedMemberUserIds = deletedMembers.map(member => { return member.userId });
    const newMemberUserIds = userIds.filter(userId => !deletedMemberUserIds.includes(userId));

    const newMembers = ChatMember.bulkBuild(
      newMemberUserIds.map(userId => ({
        userId,
        type: MemberType.User,
      }))
    );

    return await this.dbContext.transaction(async (tx) => {
      const lastMessage = await AddUsersInGroupChatHandler.getLastMessage(command.groupChat, { tx });

      await Promise.all([
        AddUsersInGroupChatHandler.addMembers({ lastMessage, newMembers, groupChat: command.groupChat }, { tx }),
        AddUsersInGroupChatHandler.restoreMembers({ lastMessage, deletedMembers, groupChat: command.groupChat }, { tx }),
      ]);

      await Promise.all(
        newMembers.map(async newMember => newMember.save({ transaction: tx })),
      )

      let messages = [];

      if (deletedMembers.length !== 0) {
        const messagesWithInfoRestoreMembers = await AddUsersInGroupChatHandler.sendInfoMessagesAboutRestoreMembers({
          lastMessage,
          deletedMembers,
          groupChat: command.groupChat,
        }, { tx });

        messages.push(...messagesWithInfoRestoreMembers);
      }

      if (newMembers.length !== 0) {
        const newMembersIds = newMembers.map(member => { return member.id});
        const members = await ChatMember.findAll({
          where: { id: newMembersIds },
          include: [{
            model: User.unscoped(),
            as: 'user',
            attributes: ["firstName", "lastName", "role"],
            include: [{
              model: Media,
              as: 'avatar',
            }]
          }],
          transaction: tx,
        });
        const messagesWithInfoAddMembers = await AddUsersInGroupChatHandler.sendInfoMessageAboutAddMember({
          newMembers: members,
          groupChat: command.groupChat,
          lastMessage,
        }, { tx });

        messages.push(...messagesWithInfoAddMembers);
      }

      return messages;
    });
  }
}

export class AddUsersInGroupChatPreAccessPermissionHandler extends HandlerDecoratorBase<AddUsersInGroupChatCommand, Promise<Message[]>> {

  private readonly accessPermission: GroupChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<AddUsersInGroupChatCommand, Promise<Message[]>>,
  ) {
    super(decorated);

    this.accessPermission = new GroupChatAccessPermission();
  }

  public async Handle(command: AddUsersInGroupChatCommand): Promise<Message[]> {
    const users: User[] =  command.users as User[];

    await this.accessPermission.UserIsNotMemberAccess(command.groupChat, users);
    await this.accessPermission.UserIsNotLeftAccess(command.groupChat, users);

    this.accessPermission.MemberHasAccess(command.groupChat, command.addInitiator);
    this.accessPermission.MemberHasOwnerAccess(command.groupChat, command.addInitiator);

    return this.decorated.Handle(command);
  }
}

export class AddUsersInGroupChatPreValidateHandler extends HandlerDecoratorBase<AddUsersInGroupChatCommand, Promise<Message[]>> {

  private readonly validator: GroupChatValidator;

  constructor(
    protected readonly decorated: IHandler<AddUsersInGroupChatCommand, Promise<Message[]>>,
  ) {
    super(decorated);

    this.validator = new GroupChatValidator();
  }

  public async Handle(command: AddUsersInGroupChatCommand): Promise<Message[]> {
    this.validator.GroupChatValidate(command.groupChat);

    return this.decorated.Handle(command);
  }
}
