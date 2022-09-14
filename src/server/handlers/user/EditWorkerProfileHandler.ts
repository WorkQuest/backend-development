import {UserValidator} from './UserValidator';
import {transformToGeoPostGIS} from '../../utils/postGIS';
import {UserAccessPermission} from './UserAccessPermission';
import {BaseDecoratorHandler, BaseDomainHandler, IHandler} from '../types';
import {SkillsFiltersController} from '../../controllers/controller.skillsFilters';
import {
  LocationFull,
  WorkerVisibility,
  EditWorkerProfileResult,
  EditWorkerProfileCommand,
} from './types';
import {
  User,
  Phone,
  Media,
  Priority,
  WorkPlace,
  PayPeriod,
  RatingStatus,
  AdditionalInfoWorker,
  UserSpecializationFilter,
  WorkerProfileVisibilitySetting,
} from '@workquest/database-models/lib/models';

interface EditPhoneNumberPayload {
  readonly user: User;
  readonly phoneNumber: Phone | null;
}

interface EditLocationPayload {
  readonly user: User;
  readonly locationFull: LocationFull | null;
}

interface SetWorkerSpecializationsPayload {
  readonly user: User;
  readonly specializationKeys: ReadonlyArray<string>;
}

interface UpdateWorkerProfileVisibilityPayload {
  readonly user: User;
  readonly profileVisibility: WorkerVisibility;
}

interface UpdateWorkerProfileInfoPayload {
  readonly user: User;
  readonly avatar: Media | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly costPerHour: string;
  readonly priority: Priority;
  readonly workplace: WorkPlace;
  readonly payPeriod: PayPeriod;
  readonly additionalInfo: AdditionalInfoWorker;
}

export class EditWorkerProfileHandler extends BaseDomainHandler<EditWorkerProfileCommand, EditWorkerProfileResult> {
  private async updateMetadata(user: User) {
    await user.update({ "metadata.state.neverEditedProfileFlag": false }, { transaction: this.options.tx });
  }

  private async setWorkerSpecializations(payload: SetWorkerSpecializationsPayload): Promise<UserSpecializationFilter[]> {
    await UserSpecializationFilter.destroy({
      where: { userId: payload.user.id },
      transaction: this.options.tx,
    });

    if (payload.specializationKeys.length <= 0) {
      return [];
    }

    // TODO
    const skillsFiltersController = await SkillsFiltersController.getInstance();
    const userSpecializations = skillsFiltersController.keysToRecords(payload.specializationKeys as string[], 'userId', payload.user.id);

    return UserSpecializationFilter.bulkCreate(userSpecializations, { transaction: this.options.tx });
  }

  private async updateWorkerProfileVisibility(payload: UpdateWorkerProfileVisibilityPayload): Promise<WorkerProfileVisibilitySetting> {
    let ratingStatusCanInviteMeOnQuest = RatingStatus.NoStatus;
    let ratingStatusInMySearch = RatingStatus.NoStatus;

    payload.profileVisibility.ratingStatusInMySearch.forEach(status =>
      (ratingStatusInMySearch |= status)
    );
    payload.profileVisibility.ratingStatusCanInviteMeOnQuest.forEach(status =>
      (ratingStatusCanInviteMeOnQuest |= status)
    );

    const workerProfileVisibilitySetting = await WorkerProfileVisibilitySetting.findOne({
      where: { userId: payload.user.id },
    });

    await workerProfileVisibilitySetting.update({
      ratingStatusInMySearch,
      ratingStatusCanInviteMeOnQuest,
    }, { transaction: this.options.tx });

    return workerProfileVisibilitySetting;
  }

  private updateWorkerProfileInfo(payload: UpdateWorkerProfileInfoPayload) {
    payload.user.avatarId = payload.avatar?.id;
    payload.user.lastName = payload.lastName;
    payload.user.firstName = payload.firstName;
    payload.user.additionalInfo = payload.additionalInfo;
    payload.user.costPerHour = payload.costPerHour;
    payload.user.priority = payload.priority;
    payload.user.workplace = payload.workplace;
    payload.user.payPeriod = payload.payPeriod;

    if (payload.avatar) {
      payload.user.setDataValue('avatar', payload.avatar);
    }
  }

  private editPhoneNumber(payload: EditPhoneNumberPayload) {
    const phonesFields = payload.phoneNumber
      ? { tempPhone: payload.user.tempPhone, phone: payload.user.phone }
      : { tempPhone: null, phone: null }

    if (payload.phoneNumber) {
      if (
        (payload.user.phone && payload.user.phone.fullPhone !== payload.phoneNumber.fullPhone) ||
        (payload.user.tempPhone && payload.user.tempPhone.fullPhone !== payload.phoneNumber.fullPhone) ||
        (!payload.user.phone && !payload.user.tempPhone)
      ) {
        phonesFields.phone = null;
        phonesFields.tempPhone = payload.phoneNumber;
      }
    }

    payload.user.phone = phonesFields.phone;
    payload.user.tempPhone = phonesFields.tempPhone;
  }

  private editLocation(payload: EditLocationPayload) {
    const locationFields = { location: null, locationPostGIS: null, locationPlaceName: null };

    if (payload.locationFull) {
      locationFields.location = payload.locationFull.location;
      locationFields.locationPlaceName = payload.locationFull.locationPlaceName;
      locationFields.locationPostGIS = transformToGeoPostGIS(payload.locationFull.location);
    }

    payload.user.location = locationFields.location;
    payload.user.locationPostGIS = locationFields.locationPostGIS;
    payload.user.locationPlaceName = locationFields.locationPlaceName;
  }

  public async Handle(command: EditWorkerProfileCommand): EditWorkerProfileResult {
    this.editLocation(command.profile);
    this.editPhoneNumber(command.profile);
    this.updateWorkerProfileInfo(command.profile);
    await this.updateMetadata(command.profile.user);

    return Promise.all([
      command.profile.user.save({ transaction: this.options.tx }),
      this.updateWorkerProfileVisibility(command.profile),
      this.setWorkerSpecializations(command.profile),
    ]);
  }
}

export class EditWorkerProfilePreValidateHandler extends BaseDecoratorHandler<EditWorkerProfileCommand, EditWorkerProfileResult> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<EditWorkerProfileCommand, EditWorkerProfileResult>
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public async Handle(command: EditWorkerProfileCommand): EditWorkerProfileResult {
    this.validator.MustBeWorker(command.profile.user);

    if (command.secure.totpCode) {
      const userWithPassword = await User.scope('withPassword').findByPk(command.profile.user.id);

      this.validator.HasActiveStatusTOTP(userWithPassword);
    }

    return this.decorated.Handle(command);
  }
}

export class EditWorkerProfilePreAccessPermissionHandler extends BaseDecoratorHandler<EditWorkerProfileCommand, EditWorkerProfileResult> {

  private readonly accessPermission: UserAccessPermission;

  constructor(
    protected readonly decorated: IHandler<EditWorkerProfileCommand, EditWorkerProfileResult>
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: EditWorkerProfileCommand): EditWorkerProfileResult {
    const user = await User.scope('withPassword').findByPk(command.profile.user.id);

    this.accessPermission.HasChangeProfileAccess(user, command.secure?.totpCode);

    return this.decorated.Handle(command);
  }
}
