import { BaseCompositeHandler } from "../../types";
import {
  RemoveChatFromChatListComposCommand,
  RemoveChatFromChatListComposResults,
} from "./types";
import {
  GetChatByIdHandler,
  GetChatByIdPostValidationHandler,
  GetChatMemberByUserHandler,
  RemoveChatFromChatsListHandler,
} from "../../chat";

export class RemoveChatFromListComposHandler extends BaseCompositeHandler<RemoveChatFromChatListComposCommand, RemoveChatFromChatListComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: RemoveChatFromChatListComposCommand): RemoveChatFromChatListComposResults {
    const chat = await new GetChatByIdPostValidationHandler(
      new  GetChatByIdHandler()
    ).Handle({ chatId: command.chatId });

    const meMember = await new GetChatMemberByUserHandler().Handle({ user: command.meUser, chat });

    await this.dbContext.transaction(async (tx) => {
      await new RemoveChatFromChatsListHandler().setOptions({ tx })
        .Handle({
          chat,
          meMember,
        });
    });
  }
}
