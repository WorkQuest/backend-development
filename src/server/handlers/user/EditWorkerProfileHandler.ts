import { UserValidator } from './UserValidator';
import { transformToGeoPostGIS } from '../../utils/postGIS';
import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import { SkillsFiltersController } from '../../controllers/controller.skillsFilters';
import { EditWorkerProfileCommand, EditWorkerProfileResult, LocationFull, WorkerVisibility } from './types';
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
    this.editLocation(command);
    this.editPhoneNumber(command);
    this.updateWorkerProfileInfo(command);

    return Promise.all([
      command.user.save({ transaction: this.options.tx }),
      this.updateWorkerProfileVisibility(command),
      this.setWorkerSpecializations(command),
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

  public Handle(command: EditWorkerProfileCommand): EditWorkerProfileResult {
    this.validator.MustBeWorker(command.user);

    return this.decorated.Handle(command);
  }
}
