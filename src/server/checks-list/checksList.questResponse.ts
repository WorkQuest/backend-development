import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  User,
  QuestsResponse,
  QuestsResponseType,
  QuestsResponseStatus,
} from '@workquest/database-models/lib/models';

abstract class BaseChecksListQuestResponse {
  protected constructor(
    protected questResponse: QuestsResponse,
  ) {
  }

  public checkStatuses(...statuses: QuestsResponseStatus[]): this | never {
    if (!statuses.includes(this.questResponse.status)) {
      throw error(Errors.InvalidStatus, "Quest response status doesn't match", {
        current: status,
        mustHave: statuses,
      });
    }

    return this;
  }

  public checkQuestsResponseMustHaveType(type: QuestsResponseType): this {
    if (this.questResponse.type !== type) {
      throw error(Errors.Forbidden, "Quest response type doesn't match", {
        mustHave: type,
        current: this.questResponse.type,
      });
    }

    return this;
  }
}

export class ChecksListQuestInvite extends BaseChecksListQuestResponse {
  constructor(
    protected questResponse: QuestsResponse,
  ) {
    super(questResponse);
  }

  public checkWorkerMustBeInvitedToQuest(worker: User): this {
    if (this.questResponse.workerId !== worker.id) {
      throw error(Errors.Forbidden, "User isn't invited to quest", {});
    }

    return this;
  }
}

export class ChecksListQuestResponse extends BaseChecksListQuestResponse {
  constructor(
    protected questResponse: QuestsResponse,
  ) {
    super(questResponse);
  }

}



