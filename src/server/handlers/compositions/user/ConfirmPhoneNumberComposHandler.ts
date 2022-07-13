import { BaseCompositeHandler } from "../../types";
import {
  ConfirmPhoneNumberComposCommand,
  ConfirmPhoneNumberComposResult
} from "./types";
import {
  GetUserByIdPostValidationHandler,
  GetUserByIdWithFullAccessHandler,
  GetUserByIdPostAccessPermissionHandler,
} from "../../user";
import { ConfirmPhoneNumberHandler, ConfirmPhoneNumberUserPreValidateHandler } from "../../user/ConfirmPhoneNumberHandler";

export class ConfirmPhoneNumberComposHandler extends BaseCompositeHandler<ConfirmPhoneNumberComposCommand, ConfirmPhoneNumberComposResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: ConfirmPhoneNumberComposCommand): ConfirmPhoneNumberComposResult {
    const recipientUser = await new GetUserByIdPostAccessPermissionHandler(
      new GetUserByIdPostValidationHandler(
        new GetUserByIdWithFullAccessHandler()
      )
    ).Handle({ userId: command.user.id });

    await this.dbContext.transaction(async (tx) => {
      await new ConfirmPhoneNumberUserPreValidateHandler(
        new ConfirmPhoneNumberHandler().setOptions({ tx })
      );
    });
  }
}
