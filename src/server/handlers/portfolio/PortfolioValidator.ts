import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import { Portfolio } from '@workquest/database-models/lib/models';

export class PortfolioValidator {
  public NotNull(portfolio: Portfolio, portfolioId: string) {
    if (!portfolio) {
      throw error(Errors.NotFound, 'Portfolio is not found', {
        portfolioId,
      });
    }
  }
}
