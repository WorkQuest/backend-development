import { BaseCompositeHandler } from "../../types";
import {
  GetQuestByIdHandler,
  GetQuestByIdValidationHandler
} from "../../quest";
import {
  MarkQuestStarComposCommand,
  MarkQuestStarComposResults,
} from "./types";
import {
  MarkQuestStarHandler
} from "../../quest/star/MarkQuestStarHandler";


export class MarkQuestStarComposHandler extends BaseCompositeHandler<MarkQuestStarComposCommand, MarkQuestStarComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: MarkQuestStarComposCommand): MarkQuestStarComposResults {
    const quest = await new GetQuestByIdValidationHandler(
      new GetQuestByIdHandler()
    ).Handle({ questId: command.questId });

    await new MarkQuestStarHandler().Handle({ quest, user: command.meUser });
  }
}
