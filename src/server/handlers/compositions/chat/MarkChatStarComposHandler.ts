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
  MarkChatStarComposCommand,
  MarkChatStarComposResults,
} from "./types";

export class MarkChatStarComposHandler extends BaseCompositeHandler<MarkChatStarComposCommand, MarkChatStarComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: MarkChatStarComposCommand): MarkChatStarComposResults {
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
