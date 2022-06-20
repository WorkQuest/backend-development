import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import { Portfolio, User } from '@workquest/database-models/lib/models';

export class PortfolioAccessPermission {
  public HasAccessToCase(user: User, portfolio: Portfolio) {
    if (portfolio.userId !== user.id) {
      throw error(Errors.Forbidden, 'User does not have access to the case', {
        userId: user.id,
        caseUserIdCreator: portfolio.userId,
      });
    }
  }
}
