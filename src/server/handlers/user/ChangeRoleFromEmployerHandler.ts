import { UserValidator } from './UserValidator';
import { UserAccessPermission } from './UserAccessPermission';
import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import {ChangeRoleFromEmployerCommand, ChangeRoleFromEmployerResult} from './types';
import {
  UserRole,
  UserChangeRoleData,
  WorkerProfileVisibilitySetting,
  EmployerProfileVisibilitySetting,
} from '@workquest/database-models/lib/models';

export class ChangeRoleFromEmployerHandler extends BaseDomainHandler<ChangeRoleFromEmployerCommand, ChangeRoleFromEmployerResult> {
  private static getDefaultAdditionalInfo(role: UserRole) {
      let additionalInfo: object = {
        description: null,
        secondMobileNumber: null,
        address: null,
        socialNetwork: {
          instagram: null,
          twitter: null,
          linkedin: null,
          facebook: null,
        },
      };

      if (role === UserRole.Worker) {
        additionalInfo = {
          ...additionalInfo,
          skills: [],
          educations: [],
          workExperiences: [],
        };
      } else if (role === UserRole.Employer) {
        additionalInfo = {
          ...additionalInfo,
          company: null,
          CEO: null,
          website: null,
        };
      }

      return additionalInfo;
    }

  public async Handle(command: ChangeRoleFromEmployerCommand): ChangeRoleFromEmployerResult {
    await Promise.all([
      UserChangeRoleData.create({
        changedAdminId: null,
        userId: command.user.id,
        movedFromRole: UserRole.Employer,
        additionalInfo: command.user.additionalInfo,
      }, { transaction: this.options.tx }),
      command.user.update({
        workplace: null,
        costPerHour: null,
        role: UserRole.Worker,
        additionalInfo: ChangeRoleFromEmployerHandler.getDefaultAdditionalInfo(UserRole.Worker),
      }, { transaction: this.options.tx }),
      WorkerProfileVisibilitySetting.findOrCreate({
        where: { userId: command.user.id },
        defaults: { userId: command.user.id },
        transaction: this.options.tx,
      }),
      EmployerProfileVisibilitySetting.destroy({
        where: { userId: command.user.id },
        transaction: this.options.tx,
      }),
    ]);
  }
}

export class ChangeRoleFromEmployerPreAccessPermissionHandler extends BaseDecoratorHandler<ChangeRoleFromEmployerCommand, ChangeRoleFromEmployerResult> {
  private readonly accessPermission: UserAccessPermission;

  constructor(
    protected readonly decorated: IHandler<ChangeRoleFromEmployerCommand, ChangeRoleFromEmployerResult>,
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: ChangeRoleFromEmployerCommand): ChangeRoleFromEmployerResult {
    this.accessPermission.HasConfirmedAccess(command.user);
    this.accessPermission.Has2FAAccess(command.user, command.code2FA);

    return this.decorated.Handle(command);
  }
}

export class ChangeRoleFromEmployerPreValidateHandler extends BaseDecoratorHandler<ChangeRoleFromEmployerCommand, ChangeRoleFromEmployerResult> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<ChangeRoleFromEmployerCommand, ChangeRoleFromEmployerResult>,
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public async Handle(command: ChangeRoleFromEmployerCommand): ChangeRoleFromEmployerResult {
    this.validator.MustBeEmployer(command.user);
    this.validator.HasActiveStatusTOTP(command.user);

    await Promise.all([
      this.validator.EmployerHasNotActiveQuests(command.user),
      this.validator.CanChangeRoleByDateRange(command.user),
    ]);

    return this.decorated.Handle(command);
  }
}
