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

interface CreateChatDataPayload extends GroupChatInfoCommand {
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

    const groupChat = await GroupChat.create({
      chatId: chat.id,
      name: payload.chatName,
      ownerMemberId: owner.id,
    }, { transaction: options.tx });

    groupChat.setDataValue('ownerMember', owner);
    chat.setDataValue('groupChat', groupChat);
    return { chat, groupChat, owner };
  }

  private static async createChatData(payload: CreateChatDataPayload, options: Options = {}) {
    const chatData = await ChatData.create({
      chatId: payload.chat.id,
      lastMessageId: payload.message.id,
    }, { transaction: options.tx });

    payload.chat.setDataValue('chatData', chatData);
  }

  public async Handle(command: CreateGroupChatCommand): Promise<[Chat, Message]> {
    return await this.dbContext.transaction(async (tx) => {
      const chatInfo = await CreateGroupChatHandler.createGroupChatAndAddMembers({ ...command }, { tx });
      const messageWithInfo = await CreateGroupChatHandler.sendInfoMessageAboutGroupChatCreate({ ...command, ...chatInfo }, { tx });
      await CreateGroupChatHandler.createChatData({ ...chatInfo, message: messageWithInfo}, { tx });

      return [chatInfo.chat, messageWithInfo];
    });
  }
}
