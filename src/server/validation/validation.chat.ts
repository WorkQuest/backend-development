import { Errors } from '../utils/errors';
import { Validator, ValidatorResult } from './types';
import {
  Chat,
  ChatType,
  ChatMember,
  MemberStatus,
  ReasonForRemovingFromChat
} from '@workquest/database-models/lib/models';

export class ChatNotNullValidator extends Validator {
  public validate(chat: Chat): ValidatorResult {
    if (!chat) {
      return {
        isValid: false,
        error: {
          code: Errors.NotFound,
          message: 'Chat is not found',
        }
      }
    }

    return super.validate(chat);
  }
}

export class GroupChatValidator extends Validator {
  public validate(chat: Chat): ValidatorResult {
    if (chat.type !== ChatType.Group) {
      return {
        isValid: false,
        error: {
          code: Errors.InvalidType,
          message: 'Chat is not group group-chat',
        }
      }
    }

    return super.validate(chat);
  }
}

export interface ChatMemberValidateContext {
  readonly chat: Chat;
}

export class MemberIsInChatValidator extends Validator {
  public validate(member: ChatMember, context: ChatMemberValidateContext): ValidatorResult {
    if (member.chatId !== context.chat.id) {
      return {
        isValid: false,
        error: {
          code: Errors.Forbidden,
          message: 'Member is not in this group-chat',
        },
      }
    }

    return super.validate(member, context);
  }
}

export class MemberAccessToGroupChatValidator extends Validator {
  public validate(member: ChatMember, context: ChatMemberValidateContext): ValidatorResult {
    if (member.chatId !== context.chat.id) {
      return {
        isValid: false,
        error: {
          code: Errors.Forbidden,
          message: 'Member is not in this group-chat',
        }
      }
    }
    if (member.status === MemberStatus.Deleted) {
      return {
        isValid: false,
        error: {
          code: Errors.Forbidden,
          message: 'Member removed/left from group-chat',
        }
      }
    }

    return super.validate(member, context);
  }
}

export class MemberIsNotOwnerValidator extends Validator {
  public validate(member: ChatMember, context: ChatMemberValidateContext): ValidatorResult {
    if (context.chat.groupChat.ownerMemberId === member.id) {
      return {
        isValid: false,
        error: {
          code: Errors.Forbidden,
          message: 'Member is owner of group group-chat',
        }
      }
    }

    return super.validate(member);
  }
}

export class OwnerMemberAccessToGroupChatValidator extends Validator {
  public validate(member: ChatMember, context: ChatMemberValidateContext): ValidatorResult {
    if (context.chat.groupChat.ownerMemberId !== member.id) {
      return {
        isValid: false,
        error: {
          code: Errors.Forbidden,
          message: 'Member is not a owner in this group-chat',
        },
      }
    }

    return super.validate(member, context);
  }
}

export class GroupChatMemberDeleteValidator extends Validator {
  public validate(member: ChatMember, context: ChatMemberValidateContext): ValidatorResult {
    if (member.status !== MemberStatus.Active) {
      return {
        isValid: false,
        error: {
          code: Errors.Forbidden,
          message: 'Chat member cannot be deleted: member is not active',
        },
      }
    }

    return super.validate(member, context);
  }
}

export class GroupChatMemberRestoreValidator extends Validator {
  public validate(member: ChatMember, context: ChatMemberValidateContext): ValidatorResult {
    if (member.status !== MemberStatus.Deleted) {
      return {
        isValid: false,
        error: {
          code: Errors.Forbidden,
          message: 'Chat member cannot be restored: member is not removed from group-chat',
        },
      }
    }
    if (member.chatMemberDeletionData.reason !== ReasonForRemovingFromChat.Removed) {
      return {
        isValid: false,
        error: {
          code: Errors.Forbidden,
          message: 'Chat member cannot be restored: member was not removed from group-chat by owner',
        },
      }
    }

    return super.validate(member, context);
  }
}


