import { IValidator } from './types';

export class ValidatorChainBuilder {
  private first: IValidator = null;
  private last: IValidator = null;

  public add(validator: IValidator): this {
    if (!this.first) {
      this.first = validator;
      this.last = validator;

      return this;
    }
    this.last = validator;
    this.last.setNextValidator(validator);

    return this;
  }

  public getFirst(): IValidator {
    return this.first;
  }
}
