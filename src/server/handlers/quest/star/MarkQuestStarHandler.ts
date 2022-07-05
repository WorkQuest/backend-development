import { IHandler } from '../../types';
import { User, QuestsStarred, Quest } from "@workquest/database-models/lib/models";

export interface MarkQuestStarCommand {
  readonly user: User;
  readonly quest: Quest;
}

export class MarkQuestStarHandler implements IHandler<MarkQuestStarCommand, Promise<void>> {
  public async Handle(command: MarkQuestStarCommand): Promise<void> {
    await QuestsStarred.findOrCreate({
      where: {
        questId: command.quest.id,
        userId: command.user.id,
      },
      defaults: {
        questId: command.quest.id,
        userId: command.user.id,
      }
    });
  }
}
