import { UserValidator } from './UserValidator';
import { transformToGeoPostGIS } from '../../utils/postGIS';
import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import {
  LocationFull,
  EmployerVisibility,
  EditEmployerProfileResult,
  EditEmployerProfileCommand,
} from './types';
import {
  User,
  Media,
  Phone,
  AdditionalInfoEmployer,
  EmployerProfileVisibilitySetting,
} from '@workquest/database-models/lib/models';

interface EditPhoneNumberPayload {
  readonly user: User;
  readonly phoneNumber: Phone | null;
}

interface EditLocationPayload {
  readonly user: User;
  readonly locationFull: LocationFull | null;
}

interface UpdateEmployerProfileVisibilityPayload {
  readonly user: User;
  readonly profileVisibility: EmployerVisibility;
}

interface UpdateEmployerProfileInfoPayload {
  readonly user: User;
  readonly avatar: Media | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly additionalInfo: AdditionalInfoEmployer;
}

export class EditEmployerProfileHandler extends BaseDomainHandler<EditEmployerProfileCommand, EditEmployerProfileResult> {
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

  private updateProfileInfo(payload: UpdateEmployerProfileInfoPayload) {
    payload.user.avatarId = payload.avatar.id;
    payload.user.lastName = payload.lastName;
    payload.user.firstName = payload.firstName;
    payload.user.additionalInfo = payload.additionalInfo;
  }

  private updateEmployerProfileInfo(payload: UpdateEmployerProfileInfoPayload) {
    payload.user.avatarId = payload.avatar.id;
    payload.user.lastName = payload.lastName;
    payload.user.firstName = payload.firstName;
    payload.user.additionalInfo = payload.additionalInfo;
  }

  private async updateEmployerProfileVisibility(payload: UpdateEmployerProfileVisibilityPayload): Promise<EmployerProfileVisibilitySetting> {
    let ratingStatusCanRespondToQuest = 0;
    let ratingStatusInMySearch = 0;

    payload.profileVisibility.ratingStatusInMySearch.forEach(status =>
      (ratingStatusInMySearch |= status)
    );
    payload.profileVisibility.ratingStatusCanRespondToQuest.forEach(status =>
      (ratingStatusCanRespondToQuest |= status)
    );

    const [, [employerProfileVisibilitySetting]] = await EmployerProfileVisibilitySetting.update({
      ratingStatusInMySearch,
      ratingStatusCanRespondToQuest,
    }, {
      where: { userId: payload.user.id },
      transaction: this.options.tx,
    });

    return employerProfileVisibilitySetting;
  }

  public async Handle(command: EditEmployerProfileCommand): EditEmployerProfileResult {
    this.editLocation(command);
    this.editPhoneNumber(command);
    this.updateProfileInfo(command);
    this.updateEmployerProfileInfo(command);

    return Promise.all([
      command.user.save({ transaction: this.options.tx }),
      this.updateEmployerProfileVisibility(command),
    ]);
  }
}

export class EditEmployerProfilePreValidateHandler extends BaseDecoratorHandler<EditEmployerProfileCommand, EditEmployerProfileResult> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<EditEmployerProfileCommand, EditEmployerProfileResult>
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public Handle(command: EditEmployerProfileCommand): EditEmployerProfileResult {
    this.validator.HasMustBeEmployer(command.user);

    return this.decorated.Handle(command);
  }
}
