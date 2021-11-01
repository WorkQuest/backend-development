import {Portfolio} from "@workquest/database-models/lib/models";
import {Transaction} from "sequelize";
import {Errors} from "../../utils/errors";
import {error} from "../../utils";

abstract class CheckList {
  public readonly abstract portfolio: Portfolio;

  protected abstract _rollbackTransaction();

  mustBeCaseCreator(userId: String) {
    if (this.portfolio.userId !== userId) {
      this._rollbackTransaction();

      throw error(Errors.Forbidden, "User is not portfolio creator", {
        current: this.portfolio.userId,
        mustHave: userId
      });
    }
  }
}

export class PortfolioController extends CheckList {
  public readonly portfolio: Portfolio;

  protected _transaction: Transaction;

  constructor(portfolio: Portfolio, transaction?: Transaction) {
    super();

    this.portfolio = portfolio;

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

export class PortfolioControllerFactory {
  public static async makeControllerByModel(portfolio: Portfolio, transaction?: Transaction): Promise<PortfolioController> {
    if (!portfolio) {
      if (transaction) {
        await transaction.rollback();
      }

      throw error(Errors.NotFound, "Portfolio not found", {});
    }

    return new PortfolioController(portfolio, transaction);
  }
}
