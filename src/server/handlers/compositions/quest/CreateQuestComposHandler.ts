import { BaseCompositeHandler } from '../../types';
import { CreateGroupChatHandler } from '../../chat';
import { LocationType, Media, PayPeriod, User, WorkPlace } from '@workquest/database-models/lib/models';
import { CreateQuestComposCommand, CreateQuestComposResults } from './types';
import { GetUserByIdHandler, GetUserByIdPostAccessPermissionHandler, GetUserByIdPostValidationHandler } from '../../user';
import { CreateQuestEmployerPreValidationHandler, CreateQuestHandler } from '../../quest/CreateQuestHandler';
import { GetMediaByIdsHandler, GetMediasPostValidationHandler } from '../../media';
import { Priority, QuestEmployment } from '@workquest/database-models/src/models';

export class CreateQuestComposHandler extends BaseCompositeHandler<CreateQuestComposCommand, CreateQuestComposResults> {
  constructor(protected readonly dbContext: any) {
    super(dbContext);
  }

  public async Handle(command: CreateQuestComposCommand): CreateQuestComposResults {
    const questCreator: User = await new GetUserByIdPostValidationHandler(
      new GetUserByIdPostAccessPermissionHandler(new GetUserByIdHandler()),
    ).Handle({ userId: command.questCreatorId });

    const medias = await new GetMediasPostValidationHandler(new GetMediaByIdsHandler()).Handle({ mediaIds: command.mediaIds });

    const quest = await this.dbContext.transaction(async (tx) => {
      await new CreateQuestEmployerPreValidationHandler(new CreateQuestHandler().setOptions({ tx })).Handle({
        questCreator,
        workplace: command.workplace,
        payPeriod: command.payPeriod,
        typeOfEmployment: command.typeOfEmployment,
        priority: command.priority,
        title: command.title,
        description: command.description,
        price: command.price,
        medias,
        locationFull: command.locationFull,
      });
    });

    //TODO: set specializations

    return quest;
  }
}
