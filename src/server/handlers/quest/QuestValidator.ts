import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import { Quest, QuestStatus } from '@workquest/database-models/lib/models';

export class QuestValidator {
  public HasNotNull(quest: Quest, questId: string) {
    if (!quest) {
      throw error(Errors.NotFound, 'Quest is not found', {
        questId,
      });
    }
  }
  public MustHasStatus(quest: Quest) {
    if ((quest.status !== QuestStatus.Pending) && (quest.status !== QuestStatus.Recruitment)) {
      throw error(Errors.NotFound, "Quest status doesn't match", {
        nededStatus: [QuestStatus.Pending, QuestStatus.Recruitment],
        current: quest.status
      });
    }
  }
}
