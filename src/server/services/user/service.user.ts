import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import { User, UserStatus } from '@workquest/database-models/lib/models';
import { UserValidatorService } from './service.user-validator';

export class UserService {

  protected readonly userValidatorService: UserValidatorService;

  constructor(
    protected readonly user: User,
  ) {
    this.userValidatorService = new UserValidatorService(user);
  }

  static async findUserById(id): Promise<User> {
    const user = await User.findByPk(id);

    if (!user) {
      throw error(Errors.NotFound, 'User not found', { id });
    }

    return user;
  }

  static async findActiveUsersByIds(ids: string[]): Promise<User[]> {
    const users = await User.findAll({
      where: { id: ids, status: UserStatus.Confirmed },
    });

    if (users.length !== ids.length) {
      const notFoundUserIds = ids.filter(id =>
        users.findIndex(u => id === u.id) === -1
      );

      throw error(Errors.NotFound, 'Users not found or not confirmed', {
        notFoundUserIds,
      });
    }

    return users;
  }

  static async findUsersByIds(ids: string[]): Promise<User[]> {
    const users = await User.findAll({
      where: { id: ids },
    });

    if (users.length !== ids.length) {
      const notFoundUserIds = ids.filter(id =>
        users.findIndex(u => id === u.id) === -1
      );

      throw error(Errors.NotFound, 'Users not found', { notFoundUserIds });
    }

    return users;
  }
}
