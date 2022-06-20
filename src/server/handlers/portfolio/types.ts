import { Media, Portfolio, User } from '@workquest/database-models/lib/models';

/** Commands */
export interface GetPortfolioCaseByIdCommand {
  readonly portfolioId: string;
}

export interface CreatePortfolioCaseCommand {
  readonly user: User;
  readonly title: string;
  readonly description: string;
  readonly medias: ReadonlyArray<Media>;
}

export interface EditPortfolioCaseCommand {
  readonly user: User;
  readonly title: string;
  readonly description: string;
  readonly portfolio: Portfolio;
  readonly medias: ReadonlyArray<Media>;
}

/** Results */
export type GetPortfolioCaseById = Promise<Portfolio>

export type CreatePortfolioCaseResult = Promise<Portfolio>

export type EditPortfolioCaseType = Promise<Portfolio>
