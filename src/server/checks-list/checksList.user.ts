import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  User,
  UserRole,
} from '@workquest/database-models/lib/models';

export class ChecksListUser {
  constructor(
    public readonly user: User,
  ) {
  }

  public checkUserRole(role: UserRole): this | never {
    if (this.user.role !== role) {
      throw error(Errors.InvalidStatus, "User role doesn't match", {
        current: this.user.role,
        mustHave: role,
      });
    }

    return this;
  }
}
