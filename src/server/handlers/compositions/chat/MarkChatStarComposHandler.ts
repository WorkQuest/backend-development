import { BaseCompositeHandler } from "../../types";
import {
  GetChatByIdHandler,
  GetChatByIdPostValidationHandler,
  GetChatMemberByUserHandler,
  GetChatMemberPostLimitedAccessPermissionHandler,
  GetChatMemberPostValidationHandler,
  MarkChatStarHandler,
} from "../../chat";
import {
  MarkChateStarComposCommand,
  MarkChatStarComposResults,
} from "./types";

export class MarkChatStarComposHandler extends BaseCompositeHandler<MarkChateStarComposCommand, MarkChatStarComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: MarkChateStarComposCommand): MarkChatStarComposResults {
    const chat = await new GetChatByIdPostValidationHandler(
      new GetChatByIdHandler()
    ).Handle({ chatId: command.chatId });

    await new GetChatMemberPostValidationHandler(
      new GetChatMemberPostLimitedAccessPermissionHandler(
        new GetChatMemberByUserHandler()
      )
    ).Handle({ chat, user: command.meUser });

    await new MarkChatStarHandler().Handle({ chat, user: command.meUser });
  }
}
