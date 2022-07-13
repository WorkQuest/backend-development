import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import {
  QuestSpecializationFilter,
  SpecializationFilter, UserSpecializationFilter
} from "@workquest/database-models/lib/models";
import { SpecializationValidator } from './SpecializationValidator';
import { MapIndustry, MapIndustryAndSpecialization, ModelRecord } from './types';

export interface SetQuestSpecializationsCommand {
  readonly keys: string[];
  readonly questId: string;
}

export interface SetUserSpecializationsCommand {
  readonly keys: string[];
  readonly userId: string;
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

export class SetUserSpecializationHandler extends BaseDomainHandler<SetUserSpecializationsCommand, Promise<void>> {
  private static splitSpecializations(payload: SetUserSpecializationsCommand): ModelRecord[] {
    const records: ModelRecord[] = [];
    for (const pair of payload.keys) {
      const [industryKey, specializationKey] = pair.split(/\./) as [string, string];
      records.push({
        path: pair,
        industryKey,
        specializationKey,
        userId: payload.userId,
      });
    }

    return records;
  }

  public async Handle(command: SetUserSpecializationsCommand): Promise<void> {
    await UserSpecializationFilter.destroy({
      where: { userId: command.userId },
      transaction: this.options.tx,
    });

    const specializationKeys = SetUserSpecializationHandler.splitSpecializations({
      keys: command.keys,
      userId: command.userId,
    });

    await UserSpecializationFilter.bulkCreate(specializationKeys, {
      transaction: this.options.tx,
    });
  }
}

export class SetSpecializationPreValidationHandler extends BaseDecoratorHandler<SetQuestSpecializationsCommand | SetUserSpecializationsCommand, Promise<void>> {
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
    const mapSpecializations = await SetSpecializationPreValidationHandler.initMap(specializations);

    this.specializationValidator.checkIndustryAndSpecializationKeyPair({
      mapSpecializations,
      keys: command.keys,
    });

    return this.decorated.Handle(command);
  }
}
