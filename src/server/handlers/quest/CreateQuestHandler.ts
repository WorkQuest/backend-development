import { BaseDomainHandler, IHandler, Options } from "../types";
import {
  Chat,
  LocationType, Media,
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
  medias: Media[],

  locationFull: {
    location: LocationType;
    locationPlaceName: string;
  },

  specializationKeys: string[],
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
  questId: string;
};

export class CreateQuestHandler extends BaseDomainHandler<CreateQuestCommand, Promise<Quest>> {
  private static async createQuest(payload: CreateQuestPayload, options: Options = {}): Promise<Quest> {
    const avatarModel = payload.medias.length === 0
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

    await quest.$set('medias', payload.medias,  {
      transaction: options.tx,
    });
    return quest;
  }

  public async Handle(command: CreateQuestCommand): Promise<Quest> {
    const quest = await CreateQuestHandler.createQuest({ ...command }, { tx: this.options.tx });

    await CreateQuestHandler.setSpecializations({ quest, specializationKeys: command.specializationKeys }, {
      tx: this.options.tx
    });

    return quest;
  }
}


export class SetQuestMediaHandler extends BaseDomainHandler<CreateQuestCommand, Promise<Quest>> {
  private static async createQuest(payload: CreateQuestPayload, options: Options = {}): Promise<Quest> {
    const avatarModel = payload.medias.length === 0
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

    await quest.$set('medias', payload.medias,  {
      transaction: options.tx,
    });
    return quest;
  }

  public async Handle(command: CreateQuestCommand): Promise<Quest> {
    const quest = await CreateQuestHandler.createQuest({ ...command }, { tx: this.options.tx });

    await CreateQuestHandler.setSpecializations({ quest, specializationKeys: command.specializationKeys }, {
      tx: this.options.tx
    });

    return quest;
  }
}