import { Chat, User } from '@workquest/database-models/lib/models';
import { error } from '../utils';
import { Errors } from '../utils/errors';

export class ChecksListChat {
  constructor(
    protected readonly chat: Chat,
  ) {
  }


}

export class ChecksListPrivateChat extends ChecksListChat {
  constructor(
    protected readonly chat: Chat,
  ) {
    super(chat);
  }

  public static checkDontSendMe(senderUserId: string, recipientUserId: string) {
    if (senderUserId === recipientUserId) {
      throw error(Errors.InvalidPayload, "You can't send a message to yourself", {});
    }
  }
}
