import { IHandler } from '../../types';
import { StarredChat, User, Chat } from '@workquest/database-models/lib/models';

export interface MarkChatStarCommand {
  readonly user: User;
  readonly chat: Chat;
}

export class MarkChatStarHandler implements IHandler<MarkChatStarCommand, Promise<void>> {
  public async Handle(command: MarkChatStarCommand): Promise<void> {
    await StarredChat.findOrCreate({
      where: {
        chatId: command.chat.id,
        userId: command.user.id,
      },
      defaults: {
        chatId: command.chat.id,
        userId: command.user.id,
      }
    });
  }
}
