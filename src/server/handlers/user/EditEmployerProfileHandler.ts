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
import { UserAccessPermission } from './UserAccessPermission';

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

  private updateEmployerProfileInfo(payload: UpdateEmployerProfileInfoPayload) {
    payload.user.avatarId = payload.avatar?.id;
    payload.user.lastName = payload.lastName;
    payload.user.firstName = payload.firstName;
    payload.user.additionalInfo = payload.additionalInfo;

    if (payload.avatar) {
      payload.user.setDataValue('avatar', payload.avatar);
    }
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

    const employerProfileVisibilitySetting = await EmployerProfileVisibilitySetting.findOne({
      where: { userId: payload.user.id },
    });

    await employerProfileVisibilitySetting.update({
      ratingStatusInMySearch,
      ratingStatusCanRespondToQuest,
    }, { transaction: this.options.tx });

    return employerProfileVisibilitySetting;
  }

  public async Handle(command: EditEmployerProfileCommand): EditEmployerProfileResult {
    this.editLocation(command.profile);
    this.editPhoneNumber(command.profile);
    this.updateEmployerProfileInfo(command.profile);

    return Promise.all([
      command.profile.user.save({ transaction: this.options.tx }),
      this.updateEmployerProfileVisibility(command.profile),
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

  public async Handle(command: EditEmployerProfileCommand): EditEmployerProfileResult {
    this.validator.MustBeEmployer(command.profile.user);

    if (command.secure.totpCode) {
      const userWithPassword = await User.scope('withPassword').findByPk(command.profile.user.id);

      this.validator.HasActiveStatusTOTP(userWithPassword);
    }

    return this.decorated.Handle(command);
  }
}

export class EditEmployerProfilePreAccessPermissionHandler extends BaseDecoratorHandler<EditEmployerProfileCommand, EditEmployerProfileResult> {

  private readonly accessPermission: UserAccessPermission;

  constructor(
    protected readonly decorated: IHandler<EditEmployerProfileCommand, EditEmployerProfileResult>
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: EditEmployerProfileCommand): EditEmployerProfileResult {
    const user = await User.scope('withPassword').findByPk(command.profile.user.id);

    this.accessPermission.HasChangeProfileAccess(user, command.secure?.totpCode);

    return this.decorated.Handle(command);
  }
}
