import { GroupChatValidator } from "./GroupChatValidator";
import { BaseDecoratorHandler, BaseDomainHandler, IHandler, Options } from "../../types";
import { GroupChatAccessPermission } from "./GroupChatAccessPermission";
import {
  Chat,
  User,
  ChatMember,
  ChatMemberData,
  ChatMemberDeletionData,
  InfoMessage,
  MemberStatus,
  Message,
  MessageAction,
  MessageType,
  ReasonForRemovingFromChat,
} from "@workquest/database-models/lib/models";

export interface LeaveFromGroupChatCommand {
  readonly member: ChatMember;
  readonly groupChat: Chat;
}

interface LeaveMemberPayload extends LeaveFromGroupChatCommand {
  readonly lastMessage: Message;
}

export class LeaveFromGroupChatHandler extends BaseDomainHandler<LeaveFromGroupChatCommand, Promise<Message>> {
  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  private static async sendInfoMessageAboutLeaveMember(payload: LeaveMemberPayload, options: Options = {}): Promise<Message> {
    const message = Message.build({
      number: payload.lastMessage.number + 1,
      chatId: payload.groupChat.id,
      senderMemberId: payload.member.id,
      type: MessageType.Info,
    });
    const info = InfoMessage.build({
      messageId: message.id,
      memberId: payload.member.id,
      messageAction: MessageAction.GroupChatLeaveMember,
    });

    await Promise.all([
      message.save({ transaction: options.tx }),
      info.save({ transaction: options.tx }),
    ]);

    const infoMessageWithUserInfo = await InfoMessage.findByPk(info.id, {
      include: [{
        model: ChatMember.unscoped(),
        as: 'member',
        attributes: ["id"],
        include: [{
          model: User.unscoped(),
          as: 'user',
          attributes: ["id", "firstName", "lastName"]
        }]
      }],
      transaction: options.tx,
    });

    message.setDataValue('infoMessage', infoMessageWithUserInfo);

    return message;
  }

  private static async leaveMember(payload: LeaveMemberPayload, options: Options = {}): Promise<[ChatMemberDeletionData]> {
    const [deletionData] = await Promise.all([
      ChatMemberDeletionData.create({
        chatMemberId: payload.member.id,
        reason: ReasonForRemovingFromChat.Left,
        beforeDeletionMessageId: payload.lastMessage.id,
        beforeDeletionMessageNumber: payload.lastMessage.number,
      }, { transaction: options.tx, }),

      payload.member.update({
        status: MemberStatus.Deleted,
      }, { transaction: options.tx }),

      ChatMemberData.destroy({
        where: { chatMemberId: payload.member.id },
        transaction: options.tx,
      }),
    ]);

    return [deletionData];
  }

  public async Handle(command: LeaveFromGroupChatCommand): Promise<Message> {
    const lastMessage = await LeaveFromGroupChatHandler.getLastMessage(command.groupChat, { tx: this.options.tx });

      const payload = { ...command, lastMessage };

    await LeaveFromGroupChatHandler.leaveMember(payload, { tx: this.options.tx });

    return await LeaveFromGroupChatHandler.sendInfoMessageAboutLeaveMember(payload, { tx: this.options.tx });
  }
}

export class LeaveFromGroupChatPreAccessPermissionHandler extends BaseDecoratorHandler<LeaveFromGroupChatCommand, Promise<Message>> {

  private readonly accessPermission: GroupChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<LeaveFromGroupChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.accessPermission = new GroupChatAccessPermission();
  }

  public async Handle(command: LeaveFromGroupChatCommand): Promise<Message> {
    this.accessPermission.MemberHasAccess(command.groupChat, command.member);

    return this.decorated.Handle(command);
  }
}

export class LeaveFromGroupChatPreValidateHandler extends BaseDecoratorHandler<LeaveFromGroupChatCommand, Promise<Message>> {

  private readonly validator: GroupChatValidator;

  constructor(
    protected readonly decorated: IHandler<LeaveFromGroupChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.validator = new GroupChatValidator();
  }

  public async Handle(command: LeaveFromGroupChatCommand): Promise<Message> {
    this.validator.GroupChatValidate(command.groupChat);
    this.validator.NotChatOwnerValidate(command.groupChat, command.member);

    return this.decorated.Handle(command);
  }
}
