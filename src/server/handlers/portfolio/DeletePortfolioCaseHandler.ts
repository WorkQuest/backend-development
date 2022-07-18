import { PortfolioAccessPermission } from './PortfolioAccessPermission';
import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import { DeletePortfolioCaseCommand, DeletePortfolioCaseType } from './types';

export class DeletePortfolioCaseHandler extends BaseDomainHandler<DeletePortfolioCaseCommand, DeletePortfolioCaseType> {
  public async Handle(command: DeletePortfolioCaseCommand): DeletePortfolioCaseType {
    await command.portfolio.destroy({ transaction: this.options.tx });
  }
}

export class DeletePortfolioCasePreAccessPermissionHandler extends BaseDecoratorHandler<DeletePortfolioCaseCommand, DeletePortfolioCaseType> {
  private readonly accessPermission: PortfolioAccessPermission;

  constructor(
    protected readonly decorated: IHandler<DeletePortfolioCaseCommand, DeletePortfolioCaseType>,
  ) {
    super(decorated);

    this.accessPermission = new PortfolioAccessPermission();
  }

  public Handle(command: DeletePortfolioCaseCommand): DeletePortfolioCaseType {
    this.accessPermission.HasAccessToCase(command.user, command.portfolio);

    return this.decorated.Handle(command);
  }
}
