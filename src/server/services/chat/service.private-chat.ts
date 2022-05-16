import { ChatService } from './service.chat';
import { Chat } from '@workquest/database-models/lib/models';

export class PrivateChatService extends ChatService {
  constructor(
    protected readonly chat: Chat,
  ) {
    super(chat);
  }


}
