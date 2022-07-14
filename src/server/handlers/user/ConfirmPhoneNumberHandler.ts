import { BaseDecoratorHandler, BaseDomainHandler, IHandler, Options } from "../types";
import { User } from "@workquest/database-models/lib/models";
import { UserValidator } from "./UserValidator";

export interface ConfirmPhoneNumberCommand {
  readonly user: User;
  readonly confirmCode: string;
}

export interface SendCodeOnPhoneNumberCommand {
  readonly user: User;
  readonly confirmCode: string;
}

export interface SendCodeOnPhoneNumberPayload extends SendCodeOnPhoneNumberCommand{
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

export class SendCodeOnPhoneNumberHandler extends BaseDomainHandler<SendCodeOnPhoneNumberCommand, Promise<void>> {
  private static async setConfirmCodeToVerifyCodeNumber(payload: SendCodeOnPhoneNumberPayload, options: Options) {
    await payload.user.update(
      {
        'settings.phoneConfirm': payload.confirmCode,
      }, { transaction: options.tx },
    );
  }

  public async Handle(command: SendCodeOnPhoneNumberCommand): Promise<void> {
    await SendCodeOnPhoneNumberHandler.setConfirmCodeToVerifyCodeNumber({ user: command.user, confirmCode: command.confirmCode }, { tx: this.options.tx });
  }
}

export class SendCodeOnPhoneNumberUserPreValidateHandler extends BaseDecoratorHandler<ConfirmPhoneNumberCommand, Promise<void>> {

  private readonly validator: UserValidator;

  constructor(
    protected readonly decorated: IHandler<SendCodeOnPhoneNumberCommand, Promise<void>>,
  ) {
    super(decorated);

    this.validator = new UserValidator();
  }

  public async Handle(command: SendCodeOnPhoneNumberCommand): Promise<void> {
    this.validator.MustNotHavePhone(command.user);
    this.validator.MustHaveVerificationPhone(command.user);

    return this.decorated.Handle(command);
  }
}
