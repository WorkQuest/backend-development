import {
  LocationFull,
  WorkerVisibility,
  EmployerVisibility, EditWorkerProfileResult, EditEmployerProfileResult
} from '../user';
import {
  User,
  Phone,
  Priority,
  UserRole,
  WorkPlace,
  PayPeriod,
  AdditionalInfoWorker,
  AdditionalInfoEmployer, WorkerProfileVisibilitySetting, UserSpecializationFilter
} from '@workquest/database-models/lib/models';

/** Commands */
export interface EditWorkerProfileCommand {
  readonly user: User;
  readonly editableRole: UserRole;
  readonly avatarId: string | null;
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
  readonly editableRole: UserRole;
  readonly avatarId: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumber: Phone | null;
  readonly locationFull: LocationFull | null;
  readonly profileVisibility: EmployerVisibility;
  readonly additionalInfo: AdditionalInfoEmployer;
}

export type EditProfileCommand =
  | EditWorkerProfileCommand
  | EditEmployerProfileCommand

/** Results */

export type EditProfileResult = Promise<
  | EditWorkerProfileResult
  | EditEmployerProfileResult
>


