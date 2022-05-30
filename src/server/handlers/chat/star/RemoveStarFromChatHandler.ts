import { IHandler } from '../../types';
import { StarredChat, User } from '@workquest/database-models/lib/models';

export interface RemoveStarFromChatCommand {
  readonly user: User;
  readonly chatId: string;
}

export class RemoveStarFromChatHandler implements IHandler<RemoveStarFromChatCommand, Promise<void>> {
  public async Handle(command: RemoveStarFromChatCommand): Promise<void> {
    await StarredChat.destroy({
      where: {
        chatId: command.chatId,
        userId: command.user.id,
      },
    });
  }
}
