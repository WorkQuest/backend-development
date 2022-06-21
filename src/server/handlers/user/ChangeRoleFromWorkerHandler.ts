import { UserValidator } from './UserValidator';
import { UserAccessPermission } from './UserAccessPermission';
import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import { ChangeRoleFromWorkerCommand, ChangeRoleFromWorkerResult } from './types';
import { UserChangeRoleData, UserRole } from '@workquest/database-models/lib/models';

export class ChangeRoleFromWorkerHandler extends BaseDomainHandler<ChangeRoleFromWorkerCommand, ChangeRoleFromWorkerResult> {
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

  public async Handle(command: ChangeRoleFromWorkerCommand): ChangeRoleFromWorkerResult {
    await Promise.all([
      UserChangeRoleData.create({
        changedAdminId: null,
        userId: command.user.id,
        priority: command.user.priority,
        movedFromRole: UserRole.Worker,
        workplace: command.user.workplace,
        costPerHour: command.user.costPerHour,
        additionalInfo: command.user.additionalInfo,
      }, { transaction: this.options.tx }),
      command.user.update({
        workplace: null,
        costPerHour: null,
        role: UserRole.Employer,
        additionalInfo: ChangeRoleFromWorkerHandler.getDefaultAdditionalInfo(UserRole.Employer),
      }, { transaction: this.options.tx })
    ]);
  }
}

export class ChangeRoleFromWorkerPreAccessPermissionHandler extends BaseDecoratorHandler<ChangeRoleFromWorkerCommand, ChangeRoleFromWorkerResult> {
  private readonly accessPermission: UserAccessPermission;

  constructor(
    protected readonly decorated: IHandler<ChangeRoleFromWorkerCommand, ChangeRoleFromWorkerResult>,
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: ChangeRoleFromWorkerCommand): ChangeRoleFromWorkerResult {
    this.accessPermission.HasConfirmedAccess(command.user);
    this.accessPermission.Has2FAAccess(command.user, command.code2FA);

    return this.decorated.Handle(command);
  }
}

export class ChangeRoleFromWorkerPreValidateHandler extends BaseDecoratorHandler<ChangeRoleFromWorkerCommand, ChangeRoleFromWorkerResult> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<ChangeRoleFromWorkerCommand, ChangeRoleFromWorkerResult>,
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public async Handle(command: ChangeRoleFromWorkerCommand): ChangeRoleFromWorkerResult {
    this.validator.MustBeWorker(command.user);
    this.validator.HasActiveStatusTOTP(command.user);

    await Promise.all([
      this.validator.WorkerHasNotActiveQuests(command.user),
      this.validator.WorkerHasNotActiveResponses(command.user),
      this.validator.CanChangeRoleByDateRange(command.user),
    ]);

    return this.decorated.Handle(command);
  }
}
