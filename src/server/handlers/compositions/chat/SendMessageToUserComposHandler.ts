import { BaseCompositeHandler } from "../../types";
import {
  SendMessageToUserComposCommand,
  SendMessageToUserComposResults
} from "./types";
import {
  SendMessageToUserHandler
} from "../../chat";
import {
  GetUserByIdHandler,
  GetUserByIdPostAccessPermissionHandler,
  GetUserByIdPostValidationHandler,
} from "../../user";
import {
  GetMediaByIdsHandler,
  GetMediasPostValidationHandler
} from "../../media";

export class SendMessageToUserComposHandler extends BaseCompositeHandler<SendMessageToUserComposCommand, SendMessageToUserComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: SendMessageToUserComposCommand): SendMessageToUserComposResults {
    const recipientUser = await new GetUserByIdPostAccessPermissionHandler(
      new GetUserByIdPostValidationHandler(
        new GetUserByIdHandler()
      )
    ).Handle({ userId: command.userId });

    const medias = await new GetMediasPostValidationHandler(
      new GetMediaByIdsHandler()
    ).Handle({ mediaIds: command.mediaIds });

    const message = await this.dbContext.transaction(async (tx) => {
      await new SendMessageToUserHandler().setOptions({ tx }).Handle({
        text: command.text,
        medias,
        sender: command.meUser,
        recipient: recipientUser,
      });
    });

    return [ recipientUser, message ];
  }
}
