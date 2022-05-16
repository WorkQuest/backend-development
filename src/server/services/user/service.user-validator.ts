import { error } from '../../utils';
import { ValidatorChainBuilder } from '../../validation/validation.chain-builder';
import { UserAccessValidator } from '../../validation/validation.user';
import { User } from '@workquest/database-models/lib/models';


export class UserValidatorService {
  constructor(
    protected readonly user: User,
  ) {
  }

  public validateActiveUser() {
    const result = new ValidatorChainBuilder()
      .add(new UserAccessValidator())
    .getFirst()
      .validate(this.user)

    if (!result.isValid) {
      throw error(result.error.code, result.error.message, {
        user: {
          id: this.user.id,
          status: this.user.status,
        }
      });
    }
  }
}
