import { UserAccessPermission } from './UserAccessPermission';
import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import { ChangeUserPasswordCommand, ChangeUserPasswordResult } from './types';

export class ChangeUserPasswordHandler extends BaseDomainHandler<ChangeUserPasswordCommand, ChangeUserPasswordResult> {
  public async Handle(command: ChangeUserPasswordCommand): ChangeUserPasswordResult {
    await command.user.update({ password: command.newPassword }, { transaction: this.options.tx });
  }
}

export class ChangeUserPasswordPreAccessPermissionHandler extends BaseDecoratorHandler<ChangeUserPasswordCommand, ChangeUserPasswordResult> {

  private readonly accessPermission: UserAccessPermission;

  constructor(
    protected readonly decorated: IHandler<ChangeUserPasswordCommand, ChangeUserPasswordResult>
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: ChangeUserPasswordCommand): ChangeUserPasswordResult {
    await this.accessPermission.HasPasswordAccess(command.user, command.oldPassword);

    return this.decorated.Handle(command);
  }
}
