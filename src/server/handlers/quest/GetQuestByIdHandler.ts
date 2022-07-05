import { BaseDecoratorHandler, IHandler } from "../types";
import { Quest } from "@workquest/database-models/lib/models";
import { GetQuestByIdCommand, GetQuestByIdResult } from "./types";
import { QuestValidator } from "./QuestValidator";


export class GetQuestByIdHandler implements IHandler<GetQuestByIdCommand, GetQuestByIdResult> {
  public async Handle(command: GetQuestByIdCommand): GetQuestByIdResult {
    return await Quest.findByPk(command.questId);
  }
}

export class GetQuestByIdPostValidationHandler extends BaseDecoratorHandler<GetQuestByIdCommand, GetQuestByIdResult> {

  private readonly validator: QuestValidator;

  constructor(
    protected readonly decorated: IHandler<GetQuestByIdCommand, GetQuestByIdResult>,
  ) {
    super(decorated);

    this.validator = new QuestValidator();
  }

  public async Handle(command: GetQuestByIdCommand): GetQuestByIdResult {
    const quest = await this.decorated.Handle(command);

    this.validator.HasNotNull(quest, command.questId);

    return quest;
  }
}

export class GetQuestByIdPostAccessPermissionHandler extends BaseDecoratorHandler<GetQuestByIdCommand, GetQuestByIdResult> {

  private readonly accessPermission: QuestAcc;

  constructor(
    protected readonly decorated: IHandler<GetQuestByIdCommand, GetQuestByIdResult>,
  ) {
    super(decorated);

    this.accessPermission = new UserAccessPermission();
  }

  public async Handle(command: GetQuestByIdCommand): GetQuestByIdResult {
    const user = await this.decorated.Handle(command);

    this.accessPermission.HasConfirmedAccess(user);

    return user;
  }
}