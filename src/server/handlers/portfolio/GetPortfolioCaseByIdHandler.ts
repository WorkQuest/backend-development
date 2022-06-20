import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import { Portfolio } from '@workquest/database-models/lib/models';
import { GetPortfolioCaseById, GetPortfolioCaseByIdCommand } from './types';
import { PortfolioValidator } from './PortfolioValidator';

export class GetPortfolioCaseByIdHandler extends BaseDomainHandler<GetPortfolioCaseByIdCommand, GetPortfolioCaseById> {
  public Handle(command: GetPortfolioCaseByIdCommand): GetPortfolioCaseById {
    return Portfolio.findByPk(command.portfolioId);
  }
}

export class GetPortfolioCaseByIdPostValidation extends BaseDecoratorHandler<GetPortfolioCaseByIdCommand, GetPortfolioCaseById> {

  private readonly validator: PortfolioValidator;

  constructor(
    protected readonly decorated: IHandler<GetPortfolioCaseByIdCommand, GetPortfolioCaseById>,
  ) {
    super(decorated);

    this.validator = new PortfolioValidator();
  }

  public async Handle(command: GetPortfolioCaseByIdCommand): GetPortfolioCaseById {
    const portfolio = await this.decorated.Handle(command);

    this.validator.NotNull(portfolio, command.portfolioId);

    return portfolio;
  }
}
