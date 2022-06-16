import {
  User,
  Media,
  Phone,
  Priority,
  WorkPlace,
  PayPeriod,
  LocationType,
  AdditionalInfoWorker,
  AdditionalInfoEmployer, UserSpecializationFilter, WorkerProfileVisibilitySetting, EmployerProfileVisibilitySetting
} from '@workquest/database-models/lib/models';

/**
 *  */
export type LocationFull = {
  location: LocationType,
  locationPlaceName: string,
}

export type WorkerVisibility = {
  ratingStatusInMySearch: ReadonlyArray<number>;
  ratingStatusCanInviteMeOnQuest: ReadonlyArray<number>;
}

export type EmployerVisibility = {
  ratingStatusInMySearch: ReadonlyArray<number>;
  ratingStatusCanRespondToQuest: ReadonlyArray<number>;
}

/** Commands */
export interface EditWorkerProfileCommand {
  readonly user: User;
  readonly avatar: Media | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly costPerHour: string;
  readonly priority: Priority;
  readonly workplace: WorkPlace;
  readonly payPeriod: PayPeriod;
  readonly phoneNumber: Phone | null;
  readonly locationFull: LocationFull | null;
  readonly profileVisibility: WorkerVisibility;
  readonly additionalInfo: AdditionalInfoWorker;
  readonly specializationKeys: ReadonlyArray<string>;
}

export interface EditEmployerProfileCommand {
  readonly user: User;
  readonly avatar: Media | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumber: Phone | null;
  readonly locationFull: LocationFull | null;
  readonly profileVisibility: EmployerVisibility;
  readonly additionalInfo: AdditionalInfoEmployer;
}

/** Results */
export type EditWorkerProfileResult = Promise<[User, WorkerProfileVisibilitySetting, UserSpecializationFilter[]]>

export type EditEmployerProfileResult = Promise<[User, EmployerProfileVisibilitySetting]>
