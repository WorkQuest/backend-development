import { error } from '../utils';
import { Errors } from '../utils/errors';
import { User, UserRole } from '@workquest/database-models/lib/models';
import { UserController } from '../controllers/user/controller.user';

export class WorkerControllerFactory {
  public static async createById(id: string): Promise<UserController | never> {
    const user = await User.findByPk(id);

    if (!user) {
      throw error(Errors.NotFound, 'User not found', { id });
    }

    return WorkerControllerFactory.createByUserModel(user);
  }

  public static createByUserModel(user: User): UserController | never {
    if (user.role !== UserRole.Worker) {
      throw error(Errors.InvalidRole, "User isn't match role", {
        current: user.role,
        mustHave: UserRole.Worker,
      });
    }

    return new UserController(user);
  }

  public static async createByAddress(address: string) {

  }
}

export class EmployerControllerFactory {
  public static async createById(id: string): Promise<UserController | never> {
    const user = await User.findByPk(id);

    if (!user) {
      throw error(Errors.NotFound, 'User not found', { id });
    }

    return EmployerControllerFactory.createByUserModel(user);
  }

  public static createByUserModel(user: User): UserController | never {
    if (user.role !== UserRole.Employer) {
      throw error(Errors.InvalidRole, "User isn't match role", {
        current: user.role,
        mustHave: UserRole.Employer,
      });
    }

    return new UserController(user);
  }

  public static async createByAddress(address: string) {

  }
}

export class UserControllerFactory {
  public static async createByIdWithPassword(userId: string): Promise<UserController> {
    const user = await User.scope('withPassword').findByPk(userId);

    if (!user) {
      throw error(Errors.NotFound, 'User not found', { userId });
    }

    return new UserController(user);
  }
}
