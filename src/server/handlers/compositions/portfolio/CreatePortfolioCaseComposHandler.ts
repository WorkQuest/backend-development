import { BaseCompositeHandler } from '../../types';
import { CreatePortfolioCaseCommand, CreatePortfolioCaseResult } from './types';
import { GetMediaByIdsHandler, GetMediasPostValidationHandler } from '../../media';
import { CreatePortfolioCaseHandler, CreatePortfolioCasePreValidationHandler } from '../../portfolio';

export class CreatePortfolioCaseComposHandler extends BaseCompositeHandler<CreatePortfolioCaseCommand, CreatePortfolioCaseResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: CreatePortfolioCaseCommand): CreatePortfolioCaseResult {
    const medias = await new GetMediasPostValidationHandler(
      new GetMediaByIdsHandler()
    ).Handle({ mediaIds: command.mediaIds });

    return await this.dbContext.transaction(async (tx) => {
      return await new CreatePortfolioCasePreValidationHandler(
        new CreatePortfolioCaseHandler().setOptions({ tx })
      ).Handle({ ...command, medias })
    });
  }
}
