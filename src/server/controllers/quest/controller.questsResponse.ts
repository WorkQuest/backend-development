import { error } from '../../utils';
import { Op, Transaction } from 'sequelize';
import { Errors } from '../../utils/errors';
import { Quest, QuestsResponse, QuestsResponseStatus, QuestsResponseType, User } from '@workquest/database-models/lib/models';

abstract class QuestsResponseHelper {
  public abstract questsResponse: QuestsResponse;

  /** Checks list */
  public workerMustBeInvitedToQuest(workerId: string): QuestsResponseHelper {
    this.questsResponseMustHaveType(QuestsResponseType.Invite);

    if (this.questsResponse.workerId !== workerId) {
      throw error(Errors.Forbidden, "User isn't invited to quest", {});
    }

    return this;
  }

  public questsResponseMustHaveStatus(status: QuestsResponseStatus): QuestsResponseHelper {
    if (this.questsResponse.status !== status) {
      throw error(Errors.Forbidden, "Quest response status doesn't match", {
        mustHave: status,
        current: this.questsResponse.status,
      });
    }

    return this;
  }

  public checkActiveResponse(): QuestsResponseHelper {
    if (this.questsResponse.type === QuestsResponseType.Response) {
      return this.questsResponseMustHaveStatus(QuestsResponseStatus.Open);
    } else if (this.questsResponse.type === QuestsResponseType.Invite) {
      return this.questsResponseMustHaveStatus(QuestsResponseStatus.Accepted);
    }
  }

  public questsResponseMustHaveType(type: QuestsResponseType): QuestsResponseHelper {
    if (this.questsResponse.type !== type) {
      throw error(Errors.Forbidden, "Quest response type doesn't match", {
        mustHave: type,
        current: this.questsResponse.type,
      });
    }

    return this;
  }
}

export class QuestsResponseController extends QuestsResponseHelper {
  constructor(public questsResponse: QuestsResponse) {
    super();

    if (!questsResponse) {
      throw error(Errors.NotFound, 'QuestsResponse not found', {});
    }
  }

  async closeOtherResponsesToQuest(quest: Quest, transaction?: Transaction) {
    try {
      await QuestsResponse.update(
        {
          status: QuestsResponseStatus.Closed,
        },
        {
          where: {
            id: { [Op.ne]: this.questsResponse.id },
            questId: quest.id,
          },
          transaction,
        },
      );
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  static async closeAllResponsesOnQuest(quest: Quest, transaction?: Transaction) {
    try {
      await QuestsResponse.update(
        { status: QuestsResponseStatus.Closed },
        {
          where: { questId: quest.id },
          transaction,
        },
      );
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async setMedias(medias, transaction?: Transaction) {
    try {
      await this.questsResponse.$set('medias', medias, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }

      throw e;
    }
  }

  static async reopenQuestResponses(quest: Quest, rejectedWorker: User, transaction?: Transaction) {
    try {
      await QuestsResponse.update(
        {
          status: QuestsResponseStatus.Open,
        },
        {
          where: {
            questId: quest.id,
            workerId: { [Op.ne]: rejectedWorker.id },
          },
          transaction,
        },
      );
      await QuestsResponse.update(
        {
          status: QuestsResponseStatus.Rejected,
          previousStatus: QuestsResponseStatus.Rejected,
        },
        {
          where: {
            questId: quest.id,
            workerId: rejectedWorker.id,
          },
          transaction,
        },
      );
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }
}
