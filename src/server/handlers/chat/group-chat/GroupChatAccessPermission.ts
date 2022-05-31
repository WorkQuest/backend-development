import {
  Chat,
  ChatMember,
  ChatMemberDeletionData, MemberStatus,
  ReasonForRemovingFromChat,
  User
} from "@workquest/database-models/lib/models";
import { error } from "../../../utils";
import { Errors } from "../../../utils/errors";

export class GroupChatAccessPermission {
  public MemberHasAccess(groupChat: Chat, member: ChatMember) {
    if (member.chatId !== groupChat.id) {
      throw error(Errors.Forbidden, 'User is not a member of this chat', {
        chatId: groupChat.id,
        userId: member.userId,
      });
    }
  }

  public MemberHasOwnerAccess(groupChat: Chat, member: ChatMember) {
    if (groupChat.groupChat.ownerMemberId !== member.id) {
      throw error(Errors.Forbidden, 'User must be owner of this chat', {
        chatId: groupChat.id,
        userId: member.userId,
      });
    }
  }

  public async UserIsNotMemberAccess(groupChat: Chat, users: User[]) {
    const userIds = users.map(user => { return user.id });

    const activeMembers = await ChatMember.findAll({
      where: {
        chatId: groupChat.id,
        userId: userIds,
        status: MemberStatus.Active,
      }
    });

    if (activeMembers.length !== 0) {
      const existingUserIds = activeMembers.map(chatMember => {
        if (userIds.includes(chatMember.userId)) {
          return chatMember.userId
        }
      });

      throw error(Errors.AlreadyExists, "Users already exist in the chat", {
        chatId: groupChat.id,
        userIds: existingUserIds
      });
    }
  }

  public async UserIsNotLeftAccess(groupChat: Chat, users: User[]) {
    const userIds = users.map(user => { return user.id });

    const leveChatMembers = await ChatMemberDeletionData.findAll({
      where: {
        reason: ReasonForRemovingFromChat.Left,
      },
      include: [{
        model: ChatMember,
        as: 'chatMember',
        where: {
          chatId: groupChat.id,
          userId: userIds
        }
      }]
    });

    if (leveChatMembers.length !== 0) {
      const leftUserIds = leveChatMembers.map(chatMember => {
        if (userIds.includes(chatMember.chatMember.userId)) {
          return chatMember.chatMember.userId
        }
      });

      throw error(Errors.UserLeaveChat, "Can't add user that left from the chat", {
        chatId: groupChat.id,
        userIds: leftUserIds
      });
    }
  }


}
