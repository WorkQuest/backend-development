import { Transaction } from 'sequelize';
import { transformToGeoPostGIS } from '../../utils/postGIS';
import { SkillsFiltersController } from '../controller.skillsFilters';
import {
  User,
  Quest,
  QuestsStarred,
  QuestStatus,
  WorkPlace,
  Priority,
  AdType,
  LocationType,
  QuestEmployment,
  QuestSpecializationFilter,
} from '@workquest/database-models/lib/models';

export interface CreatedQuestPayload {
  employer: User;

  title: string;
  price: string;
  description: string;
  adType: AdType;
  priority: Priority;
  workplace: WorkPlace;
  employment: QuestEmployment;

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

  public setMedias(medias, options: { tx?: Transaction } = {}): Promise<void> {
    return void this.quest.$set('medias', medias,  {
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

    return void QuestSpecializationFilter.bulkCreate(questSpecializations, {
      transaction: options.tx,
    });
  }

  public setStar(user: User, options: { tx?: Transaction } = {}): Promise<void> {
    return void QuestsStarred.findOrCreate({
      transaction: options.tx,
      where: { userId: user.id, questId: this.quest.id },
      defaults: { userId: user.id, questId: this.quest.id },
    });
  }

  public removeStar(user: User, options: { tx?: Transaction } = {}): Promise<void> {
    return void QuestsStarred.destroy({
      transaction: options.tx,
      where: { userId: user.id, questId: this.quest.id },
    });
  }

  public static async create(payload: CreatedQuestPayload, options: { tx?: Transaction } = {}): Promise<QuestController> {
    const quest = await Quest.create({
      userId: payload.employer.id,
      status: QuestStatus.Pending,
      workplace: payload.workplace,
      employment: payload.employment,
      priority: payload.priority,
      title: payload.title,
      description: payload.description,
      price: payload.price,
      adType: payload.adType,
      location: payload.locationFull.location,
      locationPlaceName: payload.locationFull.locationPlaceName,
      locationPostGIS: transformToGeoPostGIS(payload.locationFull.location),
    }, { transaction: options.tx });

    return new QuestController(quest);
  }
}
