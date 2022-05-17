import { UserValidator } from './UserValidator';
import { HandlerDecoratorBase, IHandler } from '../types';
import { User } from '@workquest/database-models/lib/models';
import { UserAccessPermission } from './UserAccessPermission';

export interface GetUsersByIdCommand {
  readonly userId: string;
}

export interface GetUsersByIdsCommand {
  readonly userIds: ReadonlyArray<string>;
}

export class GetUsersByIdHandler implements IHandler<GetUsersByIdCommand, Promise<User>> {
  public async Handle(command: GetUsersByIdCommand): Promise<User> {
    return await User.findByPk(command.userId);
  }
}

export class GetUsersByIdsHandler implements IHandler<GetUsersByIdsCommand, Promise<User[]>> {
  public async Handle(command: GetUsersByIdsCommand): Promise<User[]> {
    return await User.findAll({ where: { id: command.userIds } });
  }
}

export class GetUsersByIdPostValidationHandler extends HandlerDecoratorBase<GetUsersByIdCommand, Promise<User>> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<GetUsersByIdCommand, Promise<User>>,
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public async Handle(command: GetUsersByIdCommand): Promise<User> {
    const user = await this.decorated.Handle(command);

    this.validator.NotNull(user, command.userId);

    return user;
  }
}

export class GetUsersByIdPostAccessPermission extends HandlerDecoratorBase<GetUsersByIdCommand, Promise<User>> {

  private readonly accessPermission: UserAccessPermission;

  constructor(
    protected readonly decorated: IHandler<GetUsersByIdCommand, Promise<User>>,
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: GetUsersByIdCommand): Promise<User> {
    const user = await this.decorated.Handle(command);

    this.accessPermission.UserHasConfirmedAccess(user);

    return user;
  }
}

export class GetUsersByIdsPostValidationHandler extends HandlerDecoratorBase<GetUsersByIdsCommand, Promise<User[]>> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<GetUsersByIdsCommand, Promise<User[]>>,
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public async Handle(command: GetUsersByIdsCommand): Promise<User[]> {
    const users = await this.decorated.Handle(command);

    this.validator.HasCompleteSetValidate(users, command.userIds as string[]);

    return users;
  }
}

export class GetUsersByIdsPostAccessPermission extends HandlerDecoratorBase<GetUsersByIdsCommand, Promise<User[]>> {

  private readonly accessPermission: UserAccessPermission;

  constructor(
    protected readonly decorated: IHandler<GetUsersByIdsCommand, Promise<User[]>>,
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: GetUsersByIdsCommand): Promise<User[]> {
    const users = await this.decorated.Handle(command);

    this.accessPermission.UsersHasConfirmedAccess(users);

    return users;
  }
}



