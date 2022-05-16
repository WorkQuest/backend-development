import { error } from '../../utils';
import { ValidatorChainBuilder } from '../../validation/validation.chain-builder';
import { Chat, ChatMember, MemberStatus } from '@workquest/database-models/lib/models';
import {
  GroupChatValidator,
  ChatNotNullValidator,
  MemberIsInChatValidator,
  MemberIsNotOwnerValidator,
  GroupChatMemberDeleteValidator,
  GroupChatMemberRestoreValidator,
  MemberAccessToGroupChatValidator,
  OwnerMemberAccessToGroupChatValidator,
} from '../../validation/validation.chat';

export class GroupChatValidatorService {
  constructor(
    protected readonly groupChat: Chat,
  ) {
  }

  public validateGroupChat() {
    const result = new ValidatorChainBuilder()
      .add(new ChatNotNullValidator())
      .add(new GroupChatValidator())
    .getFirst()
      .validate(this.groupChat)

    if (!result.isValid) {
      throw error(result.error.code, result.error.message, {
        chat: this.groupChat
          ? { id: this.groupChat.id, type: this.groupChat.type }
          : null
      });
    }
  }

  public validateDeleteMemberFromChat(member: ChatMember) {
    const result = new ValidatorChainBuilder()
      .add(new MemberIsInChatValidator())
      .add(new GroupChatMemberDeleteValidator())
    .getFirst()
      .validate(member, { groupChat: this.groupChat })

    if (!result.isValid) {
      throw error(result.error.code, result.error.message, {
        chat: { id: this.groupChat.id },
        member: {
          chatId: member.chatId,
          status: member.status,
          deletionData: member.status === MemberStatus.Deleted
            ? { reason: member.chatMemberDeletionData.reason }
            : null
        },
      });
    }
  }

  public validateOfMemberLeaveFromChat(member: ChatMember) {
    const result = new ValidatorChainBuilder()
      .add(new MemberIsInChatValidator())
      .add(new MemberAccessToGroupChatValidator())
      .add(new MemberIsNotOwnerValidator())
    .getFirst()
      .validate(member, { groupChat: this.groupChat })

    if (!result.isValid) {
      throw error(result.error.code, result.error.message, {
        chat: { id: this.groupChat.id },
        member: {
          chatId: member.chatId,
          status: member.status,
          deletionData: member.status === MemberStatus.Deleted
            ? { reason: member.chatMemberDeletionData.reason }
            : null
        },
      });
    }
  }

  public validateForDeletedUsersRecovery(deletedMembers: ChatMember[]) {
    for (const member of deletedMembers) {
      const result = new ValidatorChainBuilder()
        .add(new MemberIsInChatValidator())
        .add(new GroupChatMemberRestoreValidator())
      .getFirst()
        .validate(member)

      if (!result.isValid) {
        throw error(result.error.code, result.error.message, {
          chat: { id: this.groupChat.id },
          member: {
            chatId: member.id,
            status: member.status,
            deletionData: member.status === MemberStatus.Deleted
              ? { reason: member.chatMemberDeletionData.reason }
              : null
          }
        });
      }
    }
  }

  public validateAccessUserAsChatOwner(member: ChatMember) {
    const result = new ValidatorChainBuilder()
      .add(new MemberIsInChatValidator())
      .add(new OwnerMemberAccessToGroupChatValidator())
    .getFirst()
      .validate(member, { groupChat: this.groupChat })

    if (!result.isValid) {
      throw error(result.error.code, result.error.message, {
        chatId: this.groupChat.id,
        member: {
          id: member.id,
          chatId: member.chatId,
        }
      });
    }
  }
}
