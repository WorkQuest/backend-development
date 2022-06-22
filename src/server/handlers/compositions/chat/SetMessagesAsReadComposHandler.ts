import { BaseCompositeHandler } from "../../types";
import {
  GetChatByIdHandler,
  GetChatByIdPostValidationHandler, GetChatMemberByUserHandler, GetChatMemberPostLimitedAccessPermissionHandler,
  GetChatMemberPostValidationHandler, GetChatMessageByIdHandler, GetChatMessageByIdPostValidatorHandler
} from "../../chat";
import {
  SetMessageAsReadComposCommand,
  SetMessageAsReadComposResults
} from "./types";


export class SetMessagesAsReadComposHandler extends BaseCompositeHandler<SetMessageAsReadComposCommand, SetMessageAsReadComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: SetMessageAsReadComposCommand): SetMessageAsReadComposResults {
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

    return [chat, message, meMember];
  }
}
