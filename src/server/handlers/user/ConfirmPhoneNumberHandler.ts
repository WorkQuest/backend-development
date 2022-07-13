import { BaseDecoratorHandler, BaseDomainHandler, IHandler, Options } from "../types";
import { User } from "@workquest/database-models/lib/models";
import { UserValidator } from "./UserValidator";

export interface ConfirmPhoneNumberCommand {
  readonly user: User;
  readonly confirmCode: string;
}

export class ConfirmPhoneNumberHandler extends BaseDomainHandler<ConfirmPhoneNumberCommand, Promise<void>> {
  private static async confirmPhoneNumber(payload: { readonly user: User }, options: Options) {
    await payload.user.update({
      phone: payload.user.tempPhone,
      tempPhone: null,
      'settings.phoneConfirm': null,
    }, { transaction: options.tx });
  }

  public async Handle(command: ConfirmPhoneNumberCommand): Promise<void> {
    await ConfirmPhoneNumberHandler.confirmPhoneNumber({ user: command.user }, { tx: this.options.tx });
  }
}

export class ConfirmPhoneNumberUserPreValidateHandler extends BaseDecoratorHandler<ConfirmPhoneNumberCommand, Promise<void>> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<ConfirmPhoneNumberCommand, Promise<void>>,
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public async Handle(command: ConfirmPhoneNumberCommand): Promise<void> {
    this.validator.MustHaveVerificationPhone(command.user);
    this.validator.MustHaveRightPhoneConfirmationCode(command.user, command.confirmCode);

    return this.decorated.Handle(command);
  }
}
