import { BaseCompositeHandler } from "../../types";
import {
  AddUserInGroupChatComposCommand,
  AddUserInGroupChatComposResults,
  LeaveFromGroupChatComposCommand,
  LeaveFromGroupChatComposResults
} from "./types";
import {
  AddUsersInGroupChatHandler,
  AddUsersInGroupChatPreAccessPermissionHandler,
  AddUsersInGroupChatPreValidateHandler,
  GetChatMemberByUserHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  GetChatMemberPostValidationHandler,
  GetGroupChatHandler,
  GetGroupChatPostValidationHandler,
  LeaveFromGroupChatHandler,
  LeaveFromGroupChatPreAccessPermissionHandler,
  LeaveFromGroupChatPreValidateHandler
} from "../../chat";
import {
  GetUsersByIdsHandler,
  GetUsersByIdsPostAccessPermissionHandler,
  GetUsersByIdsPostValidationHandler
} from "../../user";

export class AddUsersInGroupChatComposHandler extends BaseCompositeHandler<AddUserInGroupChatComposCommand, AddUserInGroupChatComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: AddUserInGroupChatComposCommand): AddUserInGroupChatComposResults {
    const groupChat = await new GetGroupChatPostValidationHandler(
      new GetGroupChatHandler()
    ).Handle({ chatId: command.chatId });

    const meMember = await new GetChatMemberPostValidationHandler(
      new GetChatMemberPostFullAccessPermissionHandler(
        new GetChatMemberByUserHandler()
      )
    ).Handle({ chat: groupChat, user: command.meUser });

    const users = await new GetUsersByIdsPostValidationHandler(
      new GetUsersByIdsPostAccessPermissionHandler(
        new GetUsersByIdsHandler()
      )
    ).Handle({ userIds: command.userIds });

    const messagesWithInfo = await this.dbContext.transaction(async (tx) => {
      await new AddUsersInGroupChatPreValidateHandler(
        new AddUsersInGroupChatPreAccessPermissionHandler(
          new AddUsersInGroupChatHandler().setOptions({ tx })
        )
      ).Handle({ groupChat, users, addInitiator: meMember })
    });

    return [ groupChat, messagesWithInfo, meMember ];
  }
}
