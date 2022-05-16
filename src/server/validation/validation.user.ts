import { Errors } from '../utils/errors';
import { Validator, ValidatorResult } from './types';
import {
  User,
  UserStatus,
} from '@workquest/database-models/lib/models';

export class UserAccessValidator extends Validator {
  public validate(user: User): ValidatorResult {
    if (user.status !== UserStatus.Confirmed) {
      return {
        isValid: false,
        error: {
          code: Errors.Forbidden,
          message: 'User access denied',
        },
      }
    }

    return super.validate(user);
  }
}
