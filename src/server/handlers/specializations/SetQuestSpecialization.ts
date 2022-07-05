import { BaseDecoratorHandler, BaseDomainHandler, IHandler, Options } from '../types';
import { Priority, QuestEmployment } from '@workquest/database-models/src/models';
import { transformToGeoPostGIS } from '../../utils/postGIS';
import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import {
  Chat,
  LocationType,
  Media,
  Message,
  PayPeriod,
  Quest,
  QuestSpecializationFilter,
  QuestStatus,
  SpecializationFilter,
  User,
  WorkPlace,
} from '@workquest/database-models/lib/models';
import { UserValidator } from '../user';
import { SpecializationValidator } from './SpecializationValidator';
import { MapIndustry, MapIndustryAndSpecialization, ModelRecord } from './types';

export interface SetQuestSpecializationsCommand {
  keys: string[];
  questId: string;
}

export interface SetUserSpecializationsCommand {
  keys: string[];
  userId: string;
}

export interface SetQuestSpecializationsPayload extends SetQuestSpecializationsCommand {}

export class SetQuestSpecializationHandler extends BaseDomainHandler<SetQuestSpecializationsCommand, Promise<void>> {
  private static splitSpecializations(payload: SetQuestSpecializationsPayload): ModelRecord[] {
    const records: ModelRecord[] = [];
    for (const pair of payload.keys) {
      const [industryKey, specializationKey] = pair.split(/\./) as [string, string];
      records.push({
        path: pair,
        industryKey,
        specializationKey,
        questId: payload.questId,
      });
    }

    return records;
  }

  public async Handle(command: SetQuestSpecializationsCommand): Promise<void> {
    await QuestSpecializationFilter.destroy({
      where: { questId: command.questId },
      transaction: this.options.tx,
    });

    const specializationKeys = SetQuestSpecializationHandler.splitSpecializations({
      keys: command.keys,
      questId: command.questId,
    });

    await QuestSpecializationFilter.bulkCreate(specializationKeys, {
      transaction: this.options.tx,
    });
  }
}

export class SetQuestSpecializationPreValidationHandler extends BaseDecoratorHandler<SetQuestSpecializationsCommand | SetUserSpecializationsCommand, Promise<void>> {
  private readonly specializationValidator: SpecializationValidator;

  constructor(protected readonly decorated: IHandler<SetQuestSpecializationsCommand | SetUserSpecializationsCommand, Promise<void>>) {
    super(decorated);

    this.specializationValidator = new SpecializationValidator();
  }

  private static initMap(specializationFilters: SpecializationFilter[]): MapIndustry | MapIndustryAndSpecialization {
    const mapSpecializations = {};
    specializationFilters.forEach((s) => {
      if (!mapSpecializations[s.industryKey]) {
        mapSpecializations[s.industryKey] = {};
      }

      mapSpecializations[s.industryKey][s.key] = s.specialization;
      mapSpecializations[`${s.industryKey}.${s.key}`] = s.specialization;
    });

    return mapSpecializations;
  }

  public async Handle(command: SetQuestSpecializationsCommand | SetUserSpecializationsCommand): Promise<void> {
    const specializations = await SpecializationFilter.findAll();
    const mapSpecializations = await SetQuestSpecializationPreValidationHandler.initMap(specializations);

    this.specializationValidator.checkIndustryAndSpecializationKeyPair({
      mapSpecializations,
      keys: command.keys,
    });

    return this.decorated.Handle(command);
  }
}
