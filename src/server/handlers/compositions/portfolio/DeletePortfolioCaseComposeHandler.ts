import { BaseCompositeHandler } from '../../types';
import { DeletePortfolioCaseCommand, DeletePortfolioCaseResult } from './types';
import {
  DeletePortfolioCaseHandler,
  GetPortfolioCaseByIdHandler,
  GetPortfolioCaseByIdPostValidation,
  DeletePortfolioCasePreAccessPermissionHandler,
} from '../../portfolio';

export class DeletePortfolioCaseComposeHandler extends BaseCompositeHandler<DeletePortfolioCaseCommand, DeletePortfolioCaseResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: DeletePortfolioCaseCommand): DeletePortfolioCaseResult {
    const portfolio = await new GetPortfolioCaseByIdPostValidation(
      new GetPortfolioCaseByIdHandler()
    ).Handle({ portfolioId: command.portfolioId })


    await this.dbContext.transaction(async (tx) => {
      await new DeletePortfolioCasePreAccessPermissionHandler(
        new DeletePortfolioCaseHandler().setOptions(tx)
      ).Handle({ portfolio, user: command.user });
    });
  }
}
