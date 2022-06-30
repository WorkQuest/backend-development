import { BaseDomainHandler, IHandler, Options } from "../../types";
import {
  Chat,
  LocationType,
  Message,
  PayPeriod, Quest, QuestSpecializationFilter, QuestStatus, SpecializationFilter,
  User, WorkPlace
} from "@workquest/database-models/lib/models";

import { Priority, QuestEmployment } from "@workquest/database-models/src/models";
import { transformToGeoPostGIS } from "../../utils/postGIS";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";

export interface CreateQuestCommand {
  readonly questCreator: User;
  workplace: WorkPlace,
  payPeriod: PayPeriod,
  typeOfEmployment: QuestEmployment,
  priority: Priority,
  title: string,
  description: string,
  price: string,
  medias: string[],
  locationFull: {
    location: LocationType;
    locationPlaceName: string;
  },
}

interface CreateQuestPayload extends CreateQuestCommand {

}

interface SetSpecializationsPayload {
  quest: Quest,
  specializationKeys: string[],
}

export type ModelRecord = {
  path: string;
  industryKey: string;
  specializationKey: string;
  [alias: string]: string;
};

export class CreateQuestHandler extends BaseDomainHandler<CreateQuestCommand, Promise<Quest>> {
  private static async setSpecializations(payload: SetSpecializationsPayload, options: Options = {}): Promise<Quest> {
    const questId = payload.quest.id;

    const counter = await QuestSpecializationFilter.count({
      where: { questId: payload.quest.id },
    });

    if (counter !== 0) {
      await QuestSpecializationFilter.destroy({
        where: { questId }, transaction: options.tx,
      });
    }
    if (keys.length === 0) {
      return;
    }

    const specializations: ModelRecord[] = [];
    const mapSpecializations = await SpecializationFilter.findAll();
    for (const keysPair of specializationKeys) {
      const [industryKey, specializationKey] = keysPair.split(/\./) as [string, string];

      if (!this.mapSpecializations[pair]) {
        throw error(Errors.NotFound, 'Keys pair path in specialization filters not found', {
          keysPair: pair,
        });
      }
      records.push({
        path: keysPair,
        industryKey,
        specializationKey,
        questId,
      });
    }

    await QuestSpecializationFilter.bulkCreate(specializations, {
      transaction: options.tx,
    });

  }

  private static async createQuest(payload: CreateQuestPayload, options: Options = {}): Promise<Quest> {
    const avatarModel = medias.length === 0
      ? null
      : payload.medias[0];

    const quest = await Quest.create({
      avatarId: avatarModel?.id,
      userId: payload.questCreator.id,
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

    await this.quest.$set('medias', payload.medias,  {
      transaction: options.tx,
    });


    return quest;
  }

  public async Handle(command: CreateQuestCommand): Promise<[Chat, Message]> {
    const quest = await CreateQuestHandler.createQuest({ ...command }, { tx: this.options.tx });

    await CreateQuestHandler.setSpecializations()

    return quest;
  }
}
