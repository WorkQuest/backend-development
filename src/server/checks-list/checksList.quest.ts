import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  User,
  Quest,
  QuestStatus,
} from '@workquest/database-models/lib/models';

export class ChecksListQuest {
  constructor(
    protected readonly quest: Quest,
  ) {
  }

  public checkOwner(user: User): this | never {
    if (this.quest.userId !== user.id) {
      throw error(Errors.Forbidden, 'The user is not the owner of the quest', {
        questId: this.quest.id, ownerUserId: this.quest.userId,
      });
    }

    return this;
  }

  public checkUserMustBelongToQuest(user: User): this {
    if (user.id !== this.quest.userId && user.id !== this.quest.assignedWorkerId) {
      throw error(Errors.Forbidden, 'User does not belong to quest', { userId: user.id });
    }

    return this;
  }

  public checkQuestStatuses(...statuses: QuestStatus[]): this | never {
    if (!statuses.includes(this.quest.status)) {
      throw error(Errors.InvalidStatus, "Quest status doesn't match", {
        current: this.quest.status,
        mustHave: statuses,
      });
    }

    return this;
  }
}
