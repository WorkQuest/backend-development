import { Chat, ChatMember, MemberStatus, Message, User } from '@workquest/database-models/lib/models';
import { ActionChatOptions } from '../../../services/chat/types';
import { IHandler } from '../../types';

export interface AddUsersInGroupChatCommand {
  readonly groupChat: Chat;
  readonly users: ReadonlyArray<User>;
}

interface RestoreUsersPayload extends AddUsersInGroupChatCommand {

}

interface AddUsersPayload extends AddUsersInGroupChatCommand {

}

export class AddUsersInGroupChatHandler implements IHandler<AddUsersInGroupChatCommand, any>{
  private static async restoreMember(remoteMember: ChatMember, options: ActionChatOptions): Promise<Message> {
    await Promise.all([
      remoteMember.update({ status: MemberStatus.Active }, { transaction: options.tx }),
      remoteMember.chatMemberDeletionData.destroy({ transaction: options.tx }),
    ]);

    return null;
  }

  public Handle(input: AddUsersInGroupChatCommand): any {
  }
}
