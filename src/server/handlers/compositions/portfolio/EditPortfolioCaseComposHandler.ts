import { BaseCompositeHandler } from '../../types';
import { EditPortfolioCaseCommand, EditPortfolioCaseResult } from './types';
import { GetMediaByIdsHandler, GetMediasPostValidationHandler } from '../../media';
import {
  EditPortfolioCaseHandler,
  GetPortfolioCaseByIdHandler,
  GetPortfolioCaseByIdPostValidation,
  EditPortfolioCasePreAccessPermissionHandler,
} from '../../portfolio';

export class EditPortfolioCaseComposHandler extends BaseCompositeHandler<EditPortfolioCaseCommand, EditPortfolioCaseResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: EditPortfolioCaseCommand): EditPortfolioCaseResult {
    const portfolio = await new GetPortfolioCaseByIdPostValidation(
      new GetPortfolioCaseByIdHandler()
    ).Handle({ portfolioId: command.portfolioId })

    const medias = await new GetMediasPostValidationHandler(
      new GetMediaByIdsHandler()
    ).Handle({ mediaIds: command.mediaIds });

    return await this.dbContext.transaction(async (tx) => {
      return await new EditPortfolioCasePreAccessPermissionHandler(
        new EditPortfolioCaseHandler().setOptions({ tx })
      ).Handle({ ...command, portfolio, medias })
    });
  }
}
