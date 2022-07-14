import { BaseCompositeHandler } from "../../types";
import {
  ConfirmPhoneNumberComposCommand,
  ConfirmPhoneNumberComposResult, SendCodeOnPhoneNumberComposCommand, SendCodeOnPhoneNumberComposResult
} from "./types";
import {
  GetUserByIdPostValidationHandler,
  GetUserByIdWithFullAccessHandler,
  GetUserByIdPostAccessPermissionHandler,
} from "../../user";
import {
  ConfirmPhoneNumberHandler,
  ConfirmPhoneNumberUserPreValidateHandler, SendCodeOnPhoneNumberHandler,
  SendCodeOnPhoneNumberUserPreValidateHandler
} from "../../user/ConfirmPhoneNumberHandler";

export class ConfirmPhoneNumberComposHandler extends BaseCompositeHandler<ConfirmPhoneNumberComposCommand, ConfirmPhoneNumberComposResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: ConfirmPhoneNumberComposCommand): ConfirmPhoneNumberComposResult {
    const user = await new GetUserByIdPostAccessPermissionHandler(
      new GetUserByIdPostValidationHandler(
        new GetUserByIdWithFullAccessHandler()
      )
    ).Handle({ userId: command.user.id });

    await this.dbContext.transaction(async (tx) => {
      await new ConfirmPhoneNumberUserPreValidateHandler(
        new ConfirmPhoneNumberHandler().setOptions({ tx })
      ).Handle({ user, confirmCode: command.confirmCode });
    });
  }
}

export class SendCodeOnPhoneNumberComposHandler extends BaseCompositeHandler<SendCodeOnPhoneNumberComposCommand, SendCodeOnPhoneNumberComposResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: SendCodeOnPhoneNumberComposCommand): SendCodeOnPhoneNumberComposResult {
    const user = await new GetUserByIdPostAccessPermissionHandler(
      new GetUserByIdPostValidationHandler(
        new GetUserByIdWithFullAccessHandler()
      )
    ).Handle({ userId: command.user.id });

    await this.dbContext.transaction(async (tx) => {
      await new SendCodeOnPhoneNumberUserPreValidateHandler(
        new SendCodeOnPhoneNumberHandler().setOptions({ tx })
      ).Handle({ user, confirmCode: command.confirmCode });
    });

    return user;
  }
}
