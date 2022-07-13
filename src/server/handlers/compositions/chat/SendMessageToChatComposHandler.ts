import { BaseCompositeHandler } from "../../types";
import {
  SendMessageToChatComposCommand,
  SendMessageToChatComposResults,
} from "./types";
import {
  GetChatByIdHandler,
  GetChatByIdPostValidationHandler,
  GetChatMemberByUserHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  GetChatMemberPostValidationHandler,
  SendMessageToChatHandler,
} from "../../chat";
import {
  GetMediaByIdsHandler,
  GetMediasPostValidationHandler
} from "../../media";

export class SendMessageToChatComposHandler extends BaseCompositeHandler<SendMessageToChatComposCommand, SendMessageToChatComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: SendMessageToChatComposCommand): SendMessageToChatComposResults {
    const chat = await new GetChatByIdPostValidationHandler(
      new GetChatByIdHandler()
    ).Handle({ chatId: command.chatId });

    const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
      new GetChatMemberPostValidationHandler(
        new GetChatMemberByUserHandler()
      )
    ).Handle({ user: command.meUser, chat });

    const medias = await new GetMediasPostValidationHandler(
      new GetMediaByIdsHandler()
    ).Handle({ mediaIds: command.mediaIds });

    const message = await this.dbContext.transaction(async (tx) => {
      await new SendMessageToChatHandler().setOptions({ tx }).Handle({
        chat,
        medias,
        sender: meMember,
        text: command.text,
      });
    });

    return [ chat, message, meMember ];
  }
}
