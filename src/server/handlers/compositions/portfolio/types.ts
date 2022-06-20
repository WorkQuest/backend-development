import { Portfolio, User } from '@workquest/database-models/lib/models';

/** Commands */
export interface CreatePortfolioCaseCommand {
  readonly user: User;
  readonly title: string;
  readonly description: string;
  readonly mediaIds: ReadonlyArray<string>;
}

export interface EditPortfolioCaseCommand {
  readonly user: User;
  readonly title: string;
  readonly description: string;
  readonly portfolioId: string;
  readonly mediaIds: ReadonlyArray<string>;
}


/** Results */
export type CreatePortfolioCaseResult = Promise<Portfolio>

export type EditPortfolioCaseResult = Promise<Portfolio>
