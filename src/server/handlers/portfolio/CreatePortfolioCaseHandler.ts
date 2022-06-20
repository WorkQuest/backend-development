import { UserValidator } from '../user';
import { Portfolio, Media } from '@workquest/database-models/lib/models';
import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import { CreatePortfolioCaseCommand, CreatePortfolioCaseResult } from './types';

export class CreatePortfolioCaseHandler extends BaseDomainHandler<CreatePortfolioCaseCommand, CreatePortfolioCaseResult> {
  public async Handle(command: CreatePortfolioCaseCommand): CreatePortfolioCaseResult {
    const portfolio = await Portfolio.create({
      title: command.title,
      userId: command.user.id,
      description: command.description,
    }, { transaction: this.options.tx });

    await portfolio.$set('medias', command.medias as Media[], { transaction: this.options.tx });

    return portfolio;
  }
}

export class CreatePortfolioCasePreValidationHandler extends BaseDecoratorHandler<CreatePortfolioCaseCommand, CreatePortfolioCaseResult> {

  private readonly userValidator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<CreatePortfolioCaseCommand, CreatePortfolioCaseResult>,
  ) {
    super(decorated);

    this.userValidator = new UserValidator();
  }

  public Handle(command: CreatePortfolioCaseCommand): CreatePortfolioCaseResult {
    this.userValidator.MustBeWorker(command.user);

    return this.decorated.Handle(command);
  }
}
