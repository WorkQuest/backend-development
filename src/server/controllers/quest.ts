import {error} from "../utils";
import {Transaction} from "sequelize";
import {UserController} from "./user";
import {Errors} from "../utils/errors";
import {keysToRecords} from "../utils/filters";
import {getMedias} from "../utils/medias";
import { transformToGeoPostGIS } from "../utils/postGIS";
import {
  User,
  Quest,
  UserRole,
  QuestStatus,
  QuestSpecializationFilter,
} from "@workquest/database-models/lib/models";

abstract class CheckList {
  protected abstract _quest: Quest;

  protected abstract _rollbackTransaction();

  protected async _checkModel(): Promise<void | never> {
    if (!this._quest) {
      await this._rollbackTransaction();

      throw error(500, "Quest model not found in quest controller", {});
    }
  }

  public async employerMustBeQuestCreator(userId: String): Promise<void | never> {
    await this._checkModel();

    if (this._quest.userId !== userId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "User is not quest creator", {
        current: this._quest.userId,
        mustHave: userId,
      });
    }
  }

  public async questMustHaveStatus(...statuses: QuestStatus[]): Promise<void | never> {
    await this._checkModel();

    if (!statuses.includes(this._quest.status)) {
      await this._rollbackTransaction();

      throw error(Errors.InvalidStatus, "Quest status doesn't match", {
        current: this._quest.status,
        mustHave: statuses,
      });
    }
  }

  public async workerMustBeAppointedOnQuest(workerId: string) {
    await this._checkModel();

    if (this._quest.assignedWorkerId !== workerId) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, "Worker is not appointed on quest", {
        current: this._quest.userId,
        mustHave: workerId,
      });
    }
  }
}

export class QuestController extends CheckList {
  private readonly _questId: string;

  protected _quest: Quest;

  protected _transaction: Transaction;

  constructor(questId: string, quest?: Quest, transaction?: Transaction) {
    super();

    this._questId = questId;

    if (quest) {
      this.setModel(quest);
    }
    if (transaction) {
      this.setTransaction(transaction);
    }
  }

  protected _rollbackTransaction(): Promise<void> {
    if (this._transaction) return this._transaction.rollback();
  }

  public async findModel(): Promise<Quest | never> {
    if (this._quest) return this._quest;

    const quest = await Quest.findByPk(this._questId);

    if (!quest) {
      throw error(Errors.NotFound, "Quest not found", {
        questId: this._questId,
      });
    }

    this._quest = quest;

    return quest;
  }

  public setModel(quest: Quest) {
    this._quest = quest;
  }

  public setTransaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  public async setMedias(mediaIds) {
    await this._checkModel();

    const medias = await getMedias(mediaIds, this._transaction);

    await this._quest.$set('medias', medias, { transaction: this._transaction });
  }

  public async setQuestSpecializations(keys: string[], isCreatedNow: boolean = false) {
    const questSpecializations = keysToRecords(keys, 'questId', this._questId);

    if (isCreatedNow) {
      await QuestSpecializationFilter.destroy({ where: { questId: this._questId }, transaction: this._transaction });
    }

    await QuestSpecializationFilter.bulkCreate(questSpecializations, { transaction: this._transaction });
  }

  public async updateFieldLocationPostGIS(): Promise<void | never> {
    await this._checkModel();

    const location = this._quest.getDataValue('location');

    if (!location) throw error(500, '', {}) // TODO

    const locationPostGIS = transformToGeoPostGIS(location);

    this._quest.setDataValue('locationPostGIS', locationPostGIS);
  }

  static async answerWorkOnQuest(questId: string, worker: User, acceptWork: boolean) {
    const userController = new UserController(worker.id, worker);
    const questController = new QuestController(questId);
    const quest = await questController.findModel();

    await userController.userMustHaveRole(UserRole.Worker);
    await questController.questMustHaveStatus(QuestStatus.WaitWorker);
    await questController.workerMustBeAppointedOnQuest(worker.id);

    if (acceptWork) {
      await quest.update({ status: QuestStatus.Active });
    } else {
      await quest.update({ status: QuestStatus.Created, assignedWorkerId: null });
    }
  }
}
