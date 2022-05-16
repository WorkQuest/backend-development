import { IHandler } from '../types';
import { Chat } from '@workquest/database-models/lib/models';

export interface GetChatByIdCommand {
  readonly chatId: string;
}

export class GetChatByIdHandler implements IHandler<GetChatByIdCommand, Promise<Chat>> {
  public Handle(command: GetChatByIdCommand): Promise<Chat> {
    return Chat.findByPk(command.chatId);
  }
}
