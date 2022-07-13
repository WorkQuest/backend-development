import { BaseCompositeHandler } from "../../types";
import {
  LeaveFromGroupChatComposCommand,
  LeaveFromGroupChatComposResults,
} from "./types";
import {
  GetChatMemberByUserHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  GetChatMemberPostValidationHandler,
  GetGroupChatHandler,
  GetGroupChatPostValidationHandler,
  LeaveFromGroupChatHandler,
  LeaveFromGroupChatPreAccessPermissionHandler,
  LeaveFromGroupChatPreValidateHandler,
} from "../../chat";

export class LeaveFromGroupChatComposHandler extends BaseCompositeHandler<LeaveFromGroupChatComposCommand, LeaveFromGroupChatComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: LeaveFromGroupChatComposCommand): LeaveFromGroupChatComposResults {
    const groupChat = await new GetGroupChatPostValidationHandler(
      new GetGroupChatHandler()
    ).Handle({ chatId: command.chatId });

    const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
      new GetChatMemberPostValidationHandler(
        new GetChatMemberByUserHandler()
      )
    ).Handle({ chat: groupChat, user: command.meUser });

    const messageWithInfo = await this.dbContext.transaction(async (tx) => {
      await new LeaveFromGroupChatPreValidateHandler(
        new LeaveFromGroupChatPreAccessPermissionHandler(
          new LeaveFromGroupChatHandler().setOptions({ tx })
        )
      ).Handle({ member: meMember, groupChat });
    });

    return [ groupChat, messageWithInfo, meMember ];
  }
}
