import { User } from '@workquest/database-models/lib/models';
import { error } from "../../utils";
import { Errors } from "../../utils/errors";

export class UserValidator {
  public HasCompleteSetValidate(users: User[], userIds: string[]) {
    if (users.length !== userIds.length) {
      const notFountUserIds = users.map(user => {
        if (!userIds.includes(user.id)) {
          return user.id
        }
      });
      throw error(Errors.NotFound, 'Users not found', { userIds: notFountUserIds });
    }
  }
}
