
export interface RestError {
  readonly code: number,
  readonly message: string;
}

export interface ValidatorResult {
  readonly isValid: boolean;
  readonly error?: RestError;
}

export interface IValidator {
  validate(model: any, context?: any): ValidatorResult;
  setNextValidator(validator: IValidator);
}

export class Validator implements IValidator {

  private nextValidator: IValidator;

  public validate(model: any, context?: any): ValidatorResult {
    if (this.nextValidator != null) {
      return this.nextValidator.validate(model, context);
    }

    return { isValid: true }
  }

  public setNextValidator(validator: IValidator) {
    this.nextValidator = validator;
  }
}
