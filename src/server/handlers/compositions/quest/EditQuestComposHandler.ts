import { BaseCompositeHandler } from '../../types';
import { EditQuestComposCommand, EditQuestComposResults } from './types';
import { GetMediaByIdsHandler, GetMediasPostValidationHandler } from '../../media';
import { SetQuestSpecializationHandler, SetQuestSpecializationPreValidationHandler } from '../../specializations/SetQuestSpecialization';
import {
  EditQuestEmployerPreValidationHandler,
  EditQuestHandler, GetQuestByIdHandler, GetQuestByIdPostValidationHandler
} from "../../quest";

export class CreateQuestComposHandler extends BaseCompositeHandler<EditQuestComposCommand, EditQuestComposResults> {
  constructor(protected readonly dbContext: any) {
    super(dbContext);
  }

  public async Handle(command: EditQuestComposCommand): EditQuestComposResults {
    const quest = await new GetQuestByIdPostValidationHandler(new GetQuestByIdHandler()).Handle({ questId: command.questId });

    const medias = await new GetMediasPostValidationHandler(new GetMediaByIdsHandler()).Handle({ mediaIds: command.mediaIds });

    return await this.dbContext.transaction(async (tx) => {
      await new EditQuestEmployerPreValidationHandler(
        new EditQuestHandler().setOptions({ tx }))
        .Handle({
          quest,
          medias,
          priority: command.priority,
          workplace: command.workplace,
          payPeriod: command.payPeriod,
          locationFull: command.locationFull,
          questCreator: command.questCreator,
          typeOfEmployment: command.typeOfEmployment,
        });

      await new SetQuestSpecializationPreValidationHandler(new SetQuestSpecializationHandler().setOptions({ tx }))
        .Handle({
        questId: quest.id,
        keys: command.specializationKeys,
      });
    });
  }
}
