import {error} from "../../utils";
import {Transaction} from "sequelize";
import { Errors } from "../../utils/errors";
import {
  Quest,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType
} from "@workquest/database-models/lib/models";
import { QueryOptions } from "sequelize/types/lib/query-interface";
import { FindOptions } from "sequelize/types/lib/model";

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

  public static async makeControllerByPk(id: string, queryOptions: QueryOptions = {}, transaction?: Transaction): Promise<QuestsResponseController> {
    const questsResponse = await QuestsResponse.findByPk(id, queryOptions);

    if (!questsResponse) {
      if (transaction) {
        await transaction.rollback();
      }

      throw error(Errors.NotFound, "QuestsResponse not found", { questsResponseId: id });
    }

    return new QuestsResponseController(questsResponse, transaction);
  }

  public static async makeControllerByQuery(findOptions: FindOptions, transaction?: Transaction): Promise<QuestsResponseController> {
    const questsResponse = await QuestsResponse.findOne(findOptions);

    if (!questsResponse) {
      if (transaction) {
        await transaction.rollback();
      }

      throw error(Errors.NotFound, "QuestsResponse not found", {});
    }

    return new QuestsResponseController(questsResponse, transaction);
  }
}
