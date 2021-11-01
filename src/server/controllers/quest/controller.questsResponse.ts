import {error} from "../../utils";
import {Transaction} from "sequelize";
import {Errors} from "../../utils/errors";
import {
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
} from "@workquest/database-models/lib/models";

abstract class CheckList {
  public readonly questsResponse: QuestsResponse;

  protected abstract _rollbackTransaction();

  async workerMustBeInvitedToQuest(workerId: String) {
    await this.questsResponseMustHaveType(QuestsResponseType.Invite);

    if (this.questsResponse.workerId !== workerId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "User isn't invited to quest", {});
    }
  }

  async questsResponseMustHaveStatus(status: QuestsResponseStatus) {
    if (this.questsResponse.status !== status) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "Quest response status doesn't match", {
        mustHave: status,
        current: this.questsResponse.status,
      });
    }
  }

  async questsResponseMustHaveType(type: QuestsResponseType) {
    if (this.questsResponse.type !== type) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "Quest response type doesn't match", {
        mustHave: type,
        current: this.questsResponse.type,
      });
    }
  }
}

export class QuestsResponseController extends CheckList {
  public readonly questsResponse: QuestsResponse;

  protected _transaction: Transaction;

  constructor(questsResponse: QuestsResponse, transaction?: Transaction) {
    super();

    this.questsResponse = questsResponse;

    if (transaction) {
      this.setTransaction(transaction);
    }
  }

  protected _rollbackTransaction(): Promise<void> {
    if (this._transaction) return this._transaction.rollback();
  }

  public setTransaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}

export class QuestsResponseControllerFactory {
  public static async makeControllerByModel(questsResponse: QuestsResponse, transaction?: Transaction): Promise<QuestsResponseController> {
    if (!questsResponse) {
      if (transaction) {
        await transaction.rollback();
      }

      throw error(Errors.NotFound, "QuestsResponse not found", {});
    }

    return new QuestsResponseController(questsResponse, transaction);
  }
}
