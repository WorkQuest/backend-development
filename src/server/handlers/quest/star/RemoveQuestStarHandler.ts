import { IHandler } from '../../types';
import { StarredChat, User } from '@workquest/database-models/lib/models';

export interface RemoveStarFromQuestCommand {
  readonly user: User;
  readonly questId: string;
}

export class RemoveStarFromQuestHandler implements IHandler<RemoveStarFromQuestCommand, Promise<void>> {
  public async Handle(command: RemoveStarFromQuestCommand): Promise<void> {
    await StarredChat.destroy({
      where: {
        chatId: command.questId,
        userId: command.user.id,
      },
    });
  }
}
