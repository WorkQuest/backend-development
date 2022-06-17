import { UserValidator } from './UserValidator';
import { BaseDecoratorHandler, IHandler } from '../types';
import { User } from '@workquest/database-models/lib/models';
import { UserAccessPermission } from './UserAccessPermission';
import {
  GetUsersByIdResult,
  GetUsersByIdsResult,
  GetUsersByIdCommand,
  GetUsersByIdsCommand,
} from './types';

export class GetUserByIdHandler implements IHandler<GetUsersByIdCommand, GetUsersByIdResult> {
  public async Handle(command: GetUsersByIdCommand): GetUsersByIdResult {
    return await User.findByPk(command.userId);
  }
}

export class GetUserByIdWithFullAccessHandler implements IHandler<GetUsersByIdCommand, GetUsersByIdResult> {
  public async Handle(command: GetUsersByIdCommand): GetUsersByIdResult {
    return await User.scope('withPassword').findByPk(command.userId);
  }
}

export class GetUsersByIdsHandler implements IHandler<GetUsersByIdsCommand, GetUsersByIdsResult> {
  public async Handle(command: GetUsersByIdsCommand): GetUsersByIdsResult {
    return await User.findAll({ where: { id: command.userIds } });
  }
}

export class GetUserByIdPostValidationHandler extends BaseDecoratorHandler<GetUsersByIdCommand, GetUsersByIdResult> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<GetUsersByIdCommand, GetUsersByIdResult>,
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public async Handle(command: GetUsersByIdCommand): GetUsersByIdResult {
    const user = await this.decorated.Handle(command);

    this.validator.NotNull(user, command.userId);

    return user;
  }
}

export class GetUserByIdPostAccessPermissionHandler extends BaseDecoratorHandler<GetUsersByIdCommand, GetUsersByIdResult> {

  private readonly accessPermission: UserAccessPermission;

  constructor(
    protected readonly decorated: IHandler<GetUsersByIdCommand, GetUsersByIdResult>,
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: GetUsersByIdCommand): GetUsersByIdResult {
    const user = await this.decorated.Handle(command);

    this.accessPermission.UserHasConfirmedAccess(user);

    return user;
  }
}

export class GetUsersByIdsPostValidationHandler extends BaseDecoratorHandler<GetUsersByIdsCommand, GetUsersByIdsResult> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<GetUsersByIdsCommand, GetUsersByIdsResult>,
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public async Handle(command: GetUsersByIdsCommand): GetUsersByIdsResult {
    const users = await this.decorated.Handle(command);

    this.validator.HasCompleteSetValidate(users, command.userIds as string[]);

    return users;
  }
}

export class GetUsersByIdsPostAccessPermissionHandler extends BaseDecoratorHandler<GetUsersByIdsCommand, GetUsersByIdsResult> {

  private readonly accessPermission: UserAccessPermission;

  constructor(
    protected readonly decorated: IHandler<GetUsersByIdsCommand, GetUsersByIdsResult>,
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: GetUsersByIdsCommand): GetUsersByIdsResult {
    const users = await this.decorated.Handle(command);

    this.accessPermission.UsersHasConfirmedAccess(users);

    return users;
  }
}



