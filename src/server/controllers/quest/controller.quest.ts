import {error} from "../../utils";
import {Transaction} from "sequelize";
import {UserController} from "../user/controller.user";
import {Errors} from "../../utils/errors";
import {keysToRecords} from "../../utils/filters";
import {getMedias} from "../../utils/medias";
import { transformToGeoPostGIS } from "../../utils/postGIS";
import {
  User,
  Quest,
  UserRole,
  QuestStatus,
  QuestSpecializationFilter,
} from "@workquest/database-models/lib/models";

abstract class CheckList {
  public readonly abstract quest: Quest;

  protected abstract _rollbackTransaction();

  public async employerMustBeQuestCreator(userId: String): Promise<void | never> {
    if (this.quest.userId !== userId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "User is not quest creator", {
        current: this.quest.userId,
        mustHave: userId,
      });
    }
  }

  public async questMustHaveStatus(...statuses: QuestStatus[]): Promise<void | never> {
    if (!statuses.includes(this.quest.status)) {
      await this._rollbackTransaction();

      throw error(Errors.InvalidStatus, "Quest status doesn't match", {
        current: this.quest.status,
        mustHave: statuses,
      });
    }
  }

  public async workerMustBeAppointedOnQuest(workerId: string) {
    if (this.quest.assignedWorkerId !== workerId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "Worker is not appointed on quest", {
        current: this.quest.userId,
        mustHave: workerId,
      });
    }
  }
}

export class QuestController extends CheckList {
  public readonly quest: Quest;

  protected _transaction: Transaction;

  constructor(quest: Quest, transaction?: Transaction) {
    super();

    this.quest = quest;

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

  public async setMedias(mediaIds) {
    const medias = await getMedias(mediaIds, this._transaction);

    await this.quest.$set('medias', medias, { transaction: this._transaction });
  }

  public async setQuestSpecializations(keys: string[], isCreatedNow: boolean = false) {
    const questSpecializations = keysToRecords(keys, 'questId', this.quest.id);

    if (isCreatedNow) {
      await QuestSpecializationFilter.destroy({ where: { questId: this.quest.id }, transaction: this._transaction });
    }

    await QuestSpecializationFilter.bulkCreate(questSpecializations, { transaction: this._transaction });
  }

  public async updateFieldLocationPostGIS(): Promise<void | never> {
    const location = this.quest.getDataValue('location');

    if (!location) throw error(500, '', {}) // TODO

    const locationPostGIS = transformToGeoPostGIS(location);

    this.quest.setDataValue('locationPostGIS', locationPostGIS);
  }

  static async answerWorkOnQuest(questId: string, worker: User, acceptWork: boolean): Promise<QuestController> {
    const userController = new UserController(worker);
    const questController = await QuestControllerFactory.makeControllerByModel(await Quest.findByPk(questId));

    await userController.userMustHaveRole(UserRole.Worker);
    await questController.questMustHaveStatus(QuestStatus.WaitWorker);
    await questController.workerMustBeAppointedOnQuest(worker.id);

    if (acceptWork) {
      await questController.quest.update({ status: QuestStatus.Active });
      questController.quest.status = QuestStatus.Active;
    } else {
      questController.quest.status = QuestStatus.Created;
      questController.quest.assignedWorkerId = null;
    }

    await questController.quest.save();

    return questController;
  }
}

export class QuestControllerFactory {
  public static async makeControllerByModel(quest: Quest, transaction?: Transaction): Promise<QuestController> {
    if (!quest) {
      if (transaction) {
        await transaction.rollback();
      }

      throw error(Errors.NotFound, "Quest not found", {});
    }

    return new QuestController(quest, transaction);
  }
}
