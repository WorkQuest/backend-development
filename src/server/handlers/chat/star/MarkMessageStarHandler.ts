import { IHandler } from '../../types';
import { StarredMessage, User, Message } from '@workquest/database-models/lib/models';

export interface UserMarkMessageStarCommand {
  readonly user: User;
  readonly message: Message;
}

export class UserMarkMessageStarHandler implements IHandler<UserMarkMessageStarCommand, Promise<void>> {
  public async Handle(command: UserMarkMessageStarCommand): Promise<void> {
    await StarredMessage.findOrCreate({
      where: {
        userId: command.user.id,
        messageId: command.message.id,
      },
      defaults: {
        userId: command.user.id,
        messageId: command.message.id,
      }
    });
  }
}
