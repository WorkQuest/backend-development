import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import { User, UserRole } from '@workquest/database-models/lib/models';

export class UserValidator {
  public NotNull(user: User, userId: string) {
    if (!user) {
      throw error(Errors.NotFound, 'User is not found', {
        userId,
      });
    }
  }
  public HasMustBeWorker(user: User) {
    if (user.role !== UserRole.Worker) {
      throw error(Errors.NotFound, 'User is not worker', {});
    }
  }
  public HasMustBeEmployer(user: User) {
    if (user.role !== UserRole.Employer) {
      throw error(Errors.NotFound, 'User is not employer', {});
    }
  }
  public HasCompleteSetValidate(users: User[], userIds: string[]) {
    if (users.length !== userIds.length) {
      const userFindingIds = users.map(user => { return user.id });
      const notFoundUserIds = userIds.filter(userId => !userFindingIds.includes(userId));
      throw error(Errors.NotFound, 'Users not found', { userIds: notFoundUserIds });
    }
  }
}
