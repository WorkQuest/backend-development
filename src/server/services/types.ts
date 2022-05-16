import { Transaction } from 'sequelize';

export interface BaseOptions {
  readonly tx?: Transaction;
}
