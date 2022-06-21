import { Transaction } from 'sequelize';

export interface Options {
  tx?: Transaction;
}

export interface IHandler<TIn, TOut> {
  Handle(input: TIn): TOut;
}

export abstract class BaseDomainHandler<TIn, TOut> implements IHandler<TIn, TOut> {
  protected options: Options = {};

  public setOptions(options: Options): this { this.options = options; return this; }

  public abstract Handle(input: TIn): TOut;
}

export abstract class BaseCompositeHandler<TIn, TOut> implements IHandler<TIn, TOut> {
  protected constructor(
    protected readonly dbContext: any,
  ) {
  }
  public abstract Handle(input: TIn): TOut;
}

export abstract class BaseDecoratorHandler<TIn, TOut> implements IHandler<TIn, TOut> {
  protected constructor(
    protected readonly decorated: IHandler<TIn, TOut>
  ) {
  }
  public abstract Handle(input: TIn): TOut;
}
