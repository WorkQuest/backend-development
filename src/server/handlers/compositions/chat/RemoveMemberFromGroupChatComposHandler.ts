import { BaseCompositeHandler } from "../../types";
import { RemoveMemberFromGroupChatComposCommand, RemoveMemberFromGroupChatComposResults } from "./types";
import {
  DeletedMemberFromGroupChatHandler,
  DeletedMemberFromGroupChatPreAccessPermissionHandler, DeletedMemberFromGroupChatPreValidateHandler,
  GetChatMemberByIdHandler,
  GetChatMemberByUserHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  GetChatMemberPostValidationHandler,
  GetGroupChatHandler,
  GetGroupChatPostValidationHandler
} from "../../chat";

export class RemoveMemberFromGroupChatComposHandler extends BaseCompositeHandler<RemoveMemberFromGroupChatComposCommand, RemoveMemberFromGroupChatComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: RemoveMemberFromGroupChatComposCommand): RemoveMemberFromGroupChatComposResults {
    const groupChat = await new GetGroupChatPostValidationHandler(
      new GetGroupChatHandler()
    ).Handle({ chatId: command.chatId });

    const member = await new GetChatMemberPostFullAccessPermissionHandler(
      new GetChatMemberPostValidationHandler(
        new GetChatMemberByIdHandler()
      )
    ).Handle({ chat: groupChat, id: command.userId });

    const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
      new GetChatMemberPostValidationHandler(
        new GetChatMemberByUserHandler()
      )
    ).Handle({ chat: groupChat, user: command.meUser });

    const messageWithInfo = await this.dbContext.transaction(async (tx) => {
      await new DeletedMemberFromGroupChatPreAccessPermissionHandler(
        new DeletedMemberFromGroupChatPreValidateHandler(
          new DeletedMemberFromGroupChatHandler().setOptions({ tx })
        )
      ).Handle({ member, groupChat, deletionInitiator: meMember });
    });

    return [groupChat, messageWithInfo, meMember];
  }
}
