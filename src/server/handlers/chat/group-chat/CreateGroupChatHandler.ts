import { IHandler, Options } from '../../types';
import {
  Chat,
  User,
  Message,
  ChatType,
  GroupChat,
  MemberType,
  ChatMember,
  MessageType,
  InfoMessage,
  MemberStatus,
  MessageAction,
  ChatMemberData,
} from '@workquest/database-models/lib/models';

export interface CreateGroupChatCommand {
  readonly chatName: string;
  readonly chatCreator: User;
  readonly invitedUsers: ReadonlyArray<User>;
}

 interface CreateGroupChatPayload extends CreateGroupChatCommand {

}

interface SendInfoMessagePayload extends CreateGroupChatCommand {
  readonly groupChat: Chat;
}

export class CreateGroupChatHandler implements IHandler<CreateGroupChatCommand, Promise<[Chat, Message]>> {
  constructor(
    private readonly dbContext: any,
  ) {
  }

  private static async sendInfoMessageAboutGroupChatCreate(payload: SendInfoMessagePayload, options: Options = {}): Promise<Message> {
    const message = Message.build({
      number: 1,
      type: MessageType.Info,
      chatId: payload.groupChat.id,
      senderMemberId: payload.groupChat.groupChat.ownerMemberId,
    });
    const info = InfoMessage.build({
      memberId: null,
      messageId: message.id,
      messageAction: MessageAction.GroupChatCreate,
    });

    await Promise.all([
      message.save({ transaction: options.tx }),
      info.save({ transaction: options.tx }),
    ]);

    message.setDataValue('infoMessage', info);

    return message;
  }

  private static async createGroupChatAndAddMembers(payload: CreateGroupChatPayload, options: Options = {}): Promise<Chat> {
    const chat = await Chat.create({ type: ChatType.Group }, { transaction: options.tx });

    const members = ChatMember.bulkBuild(
      payload.invitedUsers.map(user => ({
        chatId: chat.id,
        userId: user.id,
        type: MemberType.User,
        status: MemberStatus.Active,
      }))
    );

    if (!members.find(members => members.userId === payload.chatCreator.id)) {
      members.push(
        ChatMember.build({
          chatId: chat.id,
          type: MemberType.User,
          status: MemberStatus.Active,
          userId: payload.chatCreator.id,
        })
      )
    }

    const chatMembersData = ChatMemberData.bulkBuild(
      members.map(member => ({
        chatMemberId: member.id,
        lastReadMessageId: null,
        unreadCountMessages: 0,
        lastReadMessageNumber: null,
      }))
    );

    await Promise.all(
      members.map(async member => member.save({ transaction: options.tx })),
    );
    await Promise.all(
      chatMembersData.map(async data => data.save({ transaction: options.tx })),
    );

    const owner = members.find(members => members.userId === payload.chatCreator.id);

    const groupChatData = await GroupChat.create({
      chatId: chat.id,
      name: payload.chatName,
      ownerMemberId: owner.id,
    });

    groupChatData.setDataValue('ownerMember', owner);
    chat.setDataValue('groupChat', groupChatData);

    return chat;
  }

  public async Handle(command: CreateGroupChatCommand): Promise<[Chat, Message]> {
    return await this.dbContext.transaction(async (tx) => {
      const chat = await CreateGroupChatHandler.createGroupChatAndAddMembers({ ...command }, { tx });
      const messageWithInfo = await CreateGroupChatHandler.sendInfoMessageAboutGroupChatCreate({ ...command, groupChat: chat }, { tx });

      return [chat, messageWithInfo];
    });
  }
}
