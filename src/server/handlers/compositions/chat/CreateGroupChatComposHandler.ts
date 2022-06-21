import { BaseCompositeHandler } from "../../types";
import { CreateGroupChatHandler } from "../../chat";
import { User } from "@workquest/database-models/lib/models";
import { CreateGroupChatComposCommand, CreateGroupChatComposResults } from "./types";
import {
  GetUsersByIdsHandler,
  GetUsersByIdsPostAccessPermissionHandler,
  GetUsersByIdsPostValidationHandler
} from "../../user";


export class CreateGroupChatComposHandler extends BaseCompositeHandler<CreateGroupChatComposCommand, CreateGroupChatComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: CreateGroupChatComposCommand): CreateGroupChatComposResults {
    const invitedUsers: User[] = await new GetUsersByIdsPostValidationHandler(
      new GetUsersByIdsPostAccessPermissionHandler(
        new GetUsersByIdsHandler()
      )
    ).Handle({ userIds: command.userIds });

    const [chat, messageWithInfo] = await this.dbContext.transaction(async (tx) => {
      await new CreateGroupChatHandler().setOptions({ tx }).Handle({
        invitedUsers,
        chatName: command.chatName,
        chatCreator: command.chatCreator,
      });
    });

    return [chat, messageWithInfo]
  }
}
