import { BaseCompositeHandler } from "../../types";
import {
  GetChatByIdHandler,
  GetChatByIdPostValidationHandler,
  GetChatMemberByUserHandler,
  GetChatMemberPostLimitedAccessPermissionHandler,
  GetChatMemberPostValidationHandler,
  GetChatMessageByIdHandler,
  GetChatMessageByIdPostValidatorHandler,
  UserMarkMessageStarHandler
} from "../../chat";
import {
  MarkMessageStarComposCommand,
  MarkMessageStarComposResults,
} from "./types";

export class MarkMessageStarComposHandler extends BaseCompositeHandler<MarkMessageStarComposCommand, MarkMessageStarComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: MarkMessageStarComposCommand): MarkMessageStarComposResults {
    const chat = await new GetChatByIdPostValidationHandler(
      new GetChatByIdHandler()
    ).Handle({ chatId: command.chatId });

    const meMember = await new GetChatMemberPostValidationHandler(
      new GetChatMemberPostLimitedAccessPermissionHandler(
        new GetChatMemberByUserHandler()
      )
    ).Handle({ chat, user: command.meUser });

    const message = await new GetChatMessageByIdPostValidatorHandler(
      new GetChatMessageByIdHandler()
    ).Handle({ messageId: command.messageId, chat });

    await new UserMarkMessageStarHandler().Handle({ user: command.meUser, message });
  }
}
