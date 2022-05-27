import { IHandler, Options } from "../../types";
import {
  Chat,
  ChatData,
  ChatMember,
  ChatMemberData,
  ChatType,
  GroupChat,
  InfoMessage,
  MemberStatus,
  MemberType,
  Message,
  MessageAction,
  MessageType,
  User
} from "@workquest/database-models/lib/models";

export interface CreateGroupChatCommand {
  readonly chatName: string;
  readonly chatCreator: User;
  readonly invitedUsers: ReadonlyArray<User>;
}

interface GroupChatInfoCommand {
  chat: Chat,
  groupChat: GroupChat,
  owner: ChatMember
}

interface CreateChatDataAndChatMemberDataPayload extends GroupChatInfoCommand {
  message: Message,
}

interface CreateGroupChatPayload extends CreateGroupChatCommand {

}

interface SendInfoMessagePayload extends GroupChatInfoCommand {

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
      chatId: payload.chat.id,
      senderMemberId: payload.groupChat.ownerMemberId,
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

  private static async createGroupChatAndAddMembers(payload: CreateGroupChatPayload, options: Options = {}): Promise<GroupChatInfoCommand> {
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

    await Promise.all(
      members.map(async member => member.save({ transaction: options.tx })),
    );

    const owner = members.find(members => members.userId === payload.chatCreator.id);

    const groupChat = await GroupChat.create({
      chatId: chat.id,
      name: payload.chatName,
      ownerMemberId: owner.id,
    }, { transaction: options.tx });

    groupChat.setDataValue('ownerMember', owner);
    chat.setDataValue('groupChat', groupChat);
    chat.setDataValue('members', members);

    return { chat, groupChat, owner };
  }
//TODO: подумай, как вынести в джобу
  private static async createChatDataAndChatMemberData(payload: CreateChatDataAndChatMemberDataPayload, options: Options = {}) {
    const chatMemberData = ChatMemberData.bulkBuild(
      payload.chat.getDataValue('members').map(member => ({
        chatMemberId: member.id,
        lastReadMessageId: member.id === payload.owner.id ? payload.message.id : null,
        unreadCountMessages: member.id === payload.owner.id ? 0 : 1,
        lastReadMessageNumber: member.id === payload.owner.id ? payload.message.number : null,
      }))
    );

    await Promise.all(
      chatMemberData.map(async chatMemberData => chatMemberData.save({ transaction: options.tx })),
    );
  }

  public async Handle(command: CreateGroupChatCommand): Promise<[Chat, Message]> {
    return await this.dbContext.transaction(async (tx) => {
      const chatInfo = await CreateGroupChatHandler.createGroupChatAndAddMembers({ ...command }, { tx });
      const messageWithInfo = await CreateGroupChatHandler.sendInfoMessageAboutGroupChatCreate({ ...command, ...chatInfo }, { tx });
      await CreateGroupChatHandler.createChatDataAndChatMemberData({ ...chatInfo, message: messageWithInfo }, { tx });

      return [chatInfo.chat, messageWithInfo];
    });
  }
}
