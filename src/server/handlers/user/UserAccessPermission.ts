import * as bcrypt from "bcrypt";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { totpValidate } from '@workquest/database-models/lib/utils';
import { User, UserStatus } from "@workquest/database-models/lib/models";

export class UserAccessPermission {
  public HasConfirmedAccess(user: User) {
    if (user.status !== UserStatus.Confirmed) {
      throw error(Errors.InvalidStatus, 'Users must have confirmed status', {
        userId: user.id,
        currentStatus: user.status,
      });
    }
  }
  public UsersHasConfirmedAccess(users: User[]) {
    const unconfirmedUsers = users
      .filter(user => user.status !== UserStatus.Confirmed)
      .map(user => { return user.id });

    if (unconfirmedUsers.length !== 0 ) {
      throw error(Errors.InvalidStatus, 'Users must have confirmed status', {
        userIds: unconfirmedUsers,
      });
    }
  }
  public Has2FAAccess(user: User, code: string) {
    if (!totpValidate(code, user.settings.security.TOTP.secret)) {
      throw error(Errors.InvalidPayload, 'TOTP is invalid', [{ field: 'totp', reason: 'invalid' }]);
    }
  }
  public async HasPasswordAccess(user: User, password: string) {
    if (!user.password) {
      throw error(Errors.Forbidden, 'User not found or password does not match', {});
    }

    const isCompare = await bcrypt.compareSync(password, user.password);

    if (!isCompare) {
      throw error(Errors.Forbidden, 'User not found or password does not match', {});
    }
  }
}
