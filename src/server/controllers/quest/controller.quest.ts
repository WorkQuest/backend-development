import { Transaction } from 'sequelize';
import { transformToGeoPostGIS } from '../../utils/postGIS';
import { SkillsFiltersController } from '../controller.skillsFilters';
import {
  User,
  Quest,
  Media,
  Priority,
  WorkPlace,
  QuestStatus,
  LocationType,
  QuestsStarred,
  QuestRaiseView,
  QuestEmployment,
  QuestSpecializationFilter, PayPeriod
} from "@workquest/database-models/lib/models";

export interface EditedQuestPayload {
  avatarId: string,
  priority: Priority,
  workplace: WorkPlace,
  payPeriod: PayPeriod,
  typeOfEmployment: QuestEmployment,
  locationFull: {
    location: LocationType;
    locationPlaceName: string;
  }
}

export interface CreatedQuestPayload {
  employer: User;

  avatar: Media | null;

  title: string;
  price: string;
  description: string;
  priority: Priority;
  workplace: WorkPlace;
  payPeriod: PayPeriod;
  typeOfEmployment: QuestEmployment;

  locationFull: {
    location: LocationType;
    locationPlaceName: string;
  }
}

export class QuestController {
  constructor(
    public readonly quest: Quest,
  ) {
  }

  public async setMedias(medias, options: { tx?: Transaction } = {}): Promise<void> {
    await this.quest.$set('medias', medias,  {
      transaction: options.tx,
    });
  }

  public async setQuestSpecializations(keys: string[], options: { tx?: Transaction } = {}): Promise<void> {
    const questId = this.quest.id;

    const count = await QuestSpecializationFilter.count({
      where: { questId },
    });

    if (count !== 0) {
      await QuestSpecializationFilter.destroy({
        where: { questId }, transaction: options.tx,
      });
    }
    if (keys.length === 0) {
      return;
    }

    const skillsFiltersController = await SkillsFiltersController.getInstance();

    const questSpecializations = skillsFiltersController.keysToRecords(keys, 'questId', questId);

    await QuestSpecializationFilter.bulkCreate(questSpecializations, {
      transaction: options.tx,
    });
  }

  public setStar(user: User, options: { tx?: Transaction } = {}): Promise<any> {
    return QuestsStarred.findOrCreate({
      transaction: options.tx,
      where: { userId: user.id, questId: this.quest.id },
      defaults: { userId: user.id, questId: this.quest.id },
    });
  }

  public removeStar(user: User, options: { tx?: Transaction } = {}): Promise<any> {
    return  QuestsStarred.destroy({
      transaction: options.tx,
      where: { userId: user.id, questId: this.quest.id },
    });
  }

  public createRaiseView(options: { tx?: Transaction } = {}) {
    return QuestRaiseView.findOrCreate({
      where: { questId: this.quest.id },
      defaults: { questId: this.quest.id },
      transaction: options.tx,
    });
  }

  public static async create(payload: CreatedQuestPayload, options: { tx?: Transaction } = {}): Promise<QuestController> {
    const quest = await Quest.create({
      avatarId: payload.avatar?.id,
      userId: payload.employer.id,
      status: QuestStatus.Pending,
      workplace: payload.workplace,
      payPeriod: payload.payPeriod,
      typeOfEmployment: payload.typeOfEmployment,
      priority: payload.priority,
      title: payload.title,
      description: payload.description,
      price: payload.price,
      location: payload.locationFull.location,
      locationPlaceName: payload.locationFull.locationPlaceName,
      locationPostGIS: transformToGeoPostGIS(payload.locationFull.location),
    }, { transaction: options.tx });

    return new QuestController(quest);
  }

  public async update(payload: EditedQuestPayload, options: { tx?: Transaction } = {}) {
    await this.quest.update({
      avatarId: payload.avatarId,
      priority: payload.priority,
      workplace: payload.workplace,
      payPeriod: payload.payPeriod,
      typeOfEmployment: payload.typeOfEmployment,
      location: payload.locationFull.location,
      locationPlaceName: payload.locationFull.locationPlaceName,
      locationPostGIS: transformToGeoPostGIS(payload.locationFull.location),
    }, {
      transaction: options.tx,
    });
  }
}
