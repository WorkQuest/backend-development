import { error } from '../../../utils';
import { Errors } from '../../../utils/errors';
import { Message } from '@workquest/database-models/lib/models';

export class MessageValidator {
  public NotNull(message, messageId) {
    if (!message) {
      throw error(Errors.NotFound, 'Message does not exist', { messageId });
    }
  }
  public NotNullThisChat(message: Message, messageId: string, chatId: string) {
    if (!message) {
      throw error(Errors.NotFound, 'Message in this chat is does not exist', { messageId, chatId });
    }
  }
}
