import { Options, IHandler } from '../../types';
import {
  Chat,
  Message,
  ChatMember,
  InfoMessage,
  MessageType,
  MemberStatus,
  MessageAction,
  ChatMemberData,
  ChatMemberDeletionData,
  ReasonForRemovingFromChat,
} from '@workquest/database-models/lib/models';

export interface LeaveFromGroupChatCommand {
  readonly member: ChatMember;
  readonly groupChat: Chat;
}

interface LeaveMemberPayload extends LeaveFromGroupChatCommand {
  readonly lastMessage: Message;
}

export class LeaveFromGroupChatHandler implements IHandler<LeaveFromGroupChatCommand, Promise<Message>> {
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

    message.setDataValue('infoMessage', info);

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
    const [[deletionData], messageWithInfo] = await this.dbContext.transaction(async (tx) => {
      const lastMessage = await LeaveFromGroupChatHandler.getLastMessage(command.groupChat, { tx });

      const payload = { ...command, lastMessage };

      return Promise.all([
        LeaveFromGroupChatHandler.leaveMember(payload),
        LeaveFromGroupChatHandler.sendInfoMessageAboutLeaveMember(payload),
      ]);
    });

    return messageWithInfo;
  }
}
