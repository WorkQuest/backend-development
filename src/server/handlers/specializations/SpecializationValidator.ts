import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import { MapIndustry, MapIndustryAndSpecialization, ModelRecord } from './types';

export interface SpecializationValidatorPayload {
  mapSpecializations: MapIndustry | MapIndustryAndSpecialization;
  keys: string[] /** Sample: "1.500" */;
}

export class SpecializationValidator {
  public checkIndustryAndSpecializationKeyPair(payload: SpecializationValidatorPayload) {
    const records: ModelRecord[] = [];
    for (const pair of payload.keys) {
      if (!payload.mapSpecializations[pair]) {
        throw error(Errors.NotFound, 'Keys pair path in specialization filters not found', {
          keysPair: pair,
        });
      }
    }
  }
}
