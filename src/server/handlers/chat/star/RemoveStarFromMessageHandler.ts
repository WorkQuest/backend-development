import { IHandler } from '../../types';
import { StarredMessage, User, Message } from '@workquest/database-models/lib/models';

export class RemoveStarFromMessageCommand {
  readonly user: User;
  readonly messageId: string;
}

export class RemoveStarFromMessageHandler implements IHandler<RemoveStarFromMessageCommand, Promise<void>>{
  public async Handle(command: RemoveStarFromMessageCommand): Promise<void> {
    await StarredMessage.destroy({
      where: {
        userId: command.user.id,
        messageId: command.messageId,
      },
    });
  }
}
