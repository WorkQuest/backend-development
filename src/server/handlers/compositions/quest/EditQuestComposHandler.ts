import { BaseCompositeHandler } from '../../types';
import { Media, User } from "@workquest/database-models/lib/models";
import { EditQuestComposCommand, EditQuestComposResults } from './types';
import { GetUserByIdHandler, GetUserByIdPostAccessPermissionHandler, GetUserByIdPostValidationHandler } from '../../user';
import { CreateQuestEmployerPreValidationHandler, CreateQuestHandler } from '../../quest/CreateQuestHandler';
import { GetMediaByIdsHandler, GetMediasPostValidationHandler } from '../../media';
import { SetQuestSpecializationHandler, SetQuestSpecializationPreValidationHandler } from '../../specializations/SetQuestSpecialization';
import {
  EditQuestEmployerPreAccessHandler,
  EditQuestEmployerPreValidationHandler,
  EditQuestHandler
} from "../../quest/EditQuestHandler";

export class CreateQuestComposHandler extends BaseCompositeHandler<EditQuestComposCommand, EditQuestComposResults> {
  constructor(protected readonly dbContext: any) {
    super(dbContext);
  }

  public async Handle(command: EditQuestComposCommand): EditQuestComposResults {


    const medias = await new GetMediasPostValidationHandler(new GetMediaByIdsHandler()).Handle({ mediaIds: command.mediaIds });

    return await this.dbContext.transaction(async (tx) => {
      await new EditQuestEmployerPreValidationHandler(new EditQuestHandler().setOptions({ tx })).Handle({
        questCreator: command.questCreator,
        quest: command.quest,
        priority: command.priority,
        workplace: command.workplace,
        payPeriod: command.payPeriod,
        typeOfEmployment: command.typeOfEmployment,
        medias,
        locationFull: command.locationFull,
      });

      await new SetQuestSpecializationPreValidationHandler(new SetQuestSpecializationHandler().setOptions({ tx }))
        .Handle({
          questId: command.quest.id,
          keys: command.specializationKeys,
        });
    });
  }
}
