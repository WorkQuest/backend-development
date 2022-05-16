import { UserValidator } from './UserValidator';
import { HandlerDecoratorBase, IHandler } from '../types';
import { User } from '@workquest/database-models/lib/models';
import { UserAccessPermission } from './UserAccessPermission';

export interface GetUsersByIdsCommand {
  readonly usersIds: ReadonlyArray<string>;
}

export class GetUsersByIdsHandler implements IHandler<GetUsersByIdsCommand, Promise<User[]>> {
  public async Handle(command: GetUsersByIdsCommand): Promise<User[]> {
    return await User.findAll({ where: { ids: command.usersIds } });
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

    this.validator.HasCompleteSetValidate(users, command.usersIds as string[]);

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



