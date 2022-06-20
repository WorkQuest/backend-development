import { PortfolioAccessPermission } from './PortfolioAccessPermission';
import { EditPortfolioCaseCommand, EditPortfolioCaseType } from './types';
import { BaseDecoratorHandler, BaseDomainHandler, IHandler } from '../types';
import { Media } from '@workquest/database-models/lib/models';

export class EditPortfolioCaseHandler extends BaseDomainHandler<EditPortfolioCaseCommand, EditPortfolioCaseType> {
  public async Handle(command: EditPortfolioCaseCommand): EditPortfolioCaseType {
    await command.portfolio.update({
      title: command.title,
      description: command.description,
    }, { transaction: this.options.tx });

    await command.portfolio.$set('medias', command.medias as Media[], { transaction: this.options.tx });

    return command.portfolio;
  }
}

export class EditPortfolioCasePreAccessPermissionHandler extends BaseDecoratorHandler<EditPortfolioCaseCommand, EditPortfolioCaseType> {

  private readonly accessPermission: PortfolioAccessPermission;

  constructor(
    protected readonly decorated: IHandler<EditPortfolioCaseCommand, EditPortfolioCaseType>,
  ) {
    super(decorated);

    this.accessPermission = new PortfolioAccessPermission();
  }

  public Handle(command: EditPortfolioCaseCommand): EditPortfolioCaseType {
    this.accessPermission.HasAccessToCase(command.user, command.portfolio);

    return this.decorated.Handle(command);
  }
}
