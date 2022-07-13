import {
  LocationFull,
  WorkerVisibility,
  EmployerVisibility,
  EditWorkerProfileResult,
  EditEmployerProfileResult,
} from '../../user';
import {
  User,
  Phone,
  Session,
  Priority,
  UserRole,
  WorkPlace,
  PayPeriod,
  AdditionalInfoWorker,
  AdditionalInfoEmployer,
} from '@workquest/database-models/lib/models';

/** Commands */
export interface EditWorkerProfileComposCommand {
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

export interface EditEmployerProfileComposCommand {
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

export type EditProfileComposCommand =
  & EditWorkerProfileComposCommand
  & EditEmployerProfileComposCommand

export interface ChangeUserPasswordComposCommand {
  readonly user: User;
  readonly newPassword: string;
  readonly oldPassword: string;
  readonly currentSession: Session;
}

export interface ChangeRoleComposCommand {
  readonly user: User;
  readonly code2FA: string;
}

export interface ConfirmPhoneNumberComposCommand {
  readonly user: User;
  readonly confirmCode: string;
}
/** Results */
export type EditProfileComposResult = Promise<User>

export type ChangeUserPasswordComposResult = Promise<void>

export type ChangeRoleComposResult = Promise<void>

export type ConfirmPhoneNumberComposResult = Promise<void>


