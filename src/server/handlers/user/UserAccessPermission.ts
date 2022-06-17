import * as bcrypt from "bcrypt";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { User, UserStatus } from "@workquest/database-models/lib/models";

export class UserAccessPermission {
  public async UserHasPasswordAccess(user: User, password: string) {
    if (!user.password) {
      throw error(Errors.Forbidden, 'User not found or password does not match', {});
    }

    const isCompare = await bcrypt.compareSync(password, user.password);

    if (!isCompare) {
      throw error(Errors.Forbidden, 'User not found or password does not match', {});
    }
  }
  public UsersHasConfirmedAccess(users: User[]) {
    const unconfirmedUsers = users.filter(user => {
      if (user.status !== UserStatus.Confirmed) {
        return user.id
      }
    });

    if (unconfirmedUsers.length !== 0 ) {
      throw error(Errors.InvalidStatus, 'Users must have confirmed status', {
        userIds: unconfirmedUsers,
      });
    }
  }
  public UserHasConfirmedAccess(user: User) {
    if (user.status !== UserStatus.Confirmed) {
      throw error(Errors.InvalidStatus, 'Users must have confirmed status', {
        userId: user.id,
        currentStatus: user.status,
      });
    }
  }
}
