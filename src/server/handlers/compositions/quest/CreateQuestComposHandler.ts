import { BaseCompositeHandler } from '../../types';
import { User } from '@workquest/database-models/lib/models';
import { CreateQuestComposCommand, CreateQuestComposResults } from './types';
import { GetUserByIdHandler, GetUserByIdPostAccessPermissionHandler, GetUserByIdPostValidationHandler } from '../../user';
import { CreateQuestEmployerPreValidationHandler, CreateQuestHandler } from "../../quest";
import { GetMediaByIdsHandler, GetMediasPostValidationHandler } from '../../media';
import { SetQuestSpecializationHandler, SetSpecializationPreValidationHandler } from '../../specializations/SetSpecialization';

export class CreateQuestComposHandler extends BaseCompositeHandler<CreateQuestComposCommand, CreateQuestComposResults> {
  constructor(protected readonly dbContext: any) {
    super(dbContext);
  }

  public async Handle(command: CreateQuestComposCommand): CreateQuestComposResults {
    const questCreator: User = await new GetUserByIdPostValidationHandler(
      new GetUserByIdPostAccessPermissionHandler(new GetUserByIdHandler()),
    ).Handle({ userId: command.questCreatorId });

    const medias = await new GetMediasPostValidationHandler(new GetMediaByIdsHandler()).Handle({ mediaIds: command.mediaIds });

    return await this.dbContext.transaction(async (tx) => {
      const quest = await new CreateQuestEmployerPreValidationHandler(new CreateQuestHandler().setOptions({ tx })).Handle({
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

      await new SetSpecializationPreValidationHandler(new SetQuestSpecializationHandler().setOptions({ tx }))
        .Handle({
          questId: quest.id,
          keys: command.specializationKeys,
        });
    });
  }
}
