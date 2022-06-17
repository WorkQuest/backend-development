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
import { ChangeUserPasswordHandler } from './ChangeUserPasswordHandler';
import { GetUserByIdHandler } from './GetUserByIdHandler';
import { ChangeRoleFromWorkerHandler } from './ChangeRoleFromWorkerHandler';

/** */
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
export interface GetUsersByIdCommand {
  readonly userId: string;
}

export interface GetUsersByIdsCommand {
  readonly userIds: ReadonlyArray<string>;
}

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

export interface ChangeUserPasswordCommand {
  readonly user: User;
  readonly newPassword: string;
  readonly oldPassword: string;
}

export interface LogoutAllSessionsCommand {
  readonly user: User;
}

export interface ChangeRoleFromWorkerCommand {
  readonly user: User;
  readonly code2FA: string;
}

export interface ChangeRoleFromEmployerCommand {
  readonly user: User;
  readonly code2FA: string;
}

/** Results */
export type GetUsersByIdResult = Promise<User>

export type GetUsersByIdsResult = Promise<User[]>

export type EditWorkerProfileResult = Promise<[User, WorkerProfileVisibilitySetting, UserSpecializationFilter[]]>

export type EditEmployerProfileResult = Promise<[User, EmployerProfileVisibilitySetting]>

export type ChangeUserPasswordResult = Promise<void>

export type LogoutAllSessionsResult = Promise<void>

export type ChangeRoleFromWorkerResult = Promise<void>

export type ChangeRoleFromEmployerResult = Promise<void>
