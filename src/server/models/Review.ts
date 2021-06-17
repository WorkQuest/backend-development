import { Column, DataType, ForeignKey, Model } from 'sequelize-typescript';
import { User } from './User';
import { Quest } from './Quest';
import { getUUID } from '../utils';

enum Mark {
  one = 0,
  two,
  three,
  four,
  five
}

export class Review extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => Quest) @Column({type: DataType.STRING, allowNull: false}) questId: string;
  @ForeignKey(() => User) @Column({type: DataType.STRING, allowNull: false}) fromUserId: string;
  @ForeignKey(() => User) @Column({type: DataType.STRING, allowNull: false}) toUserId: string;

  @Column({type: DataType.TEXT, allowNull: false }) message: string;
  @Column({type: DataType.INTEGER, allowNull: false }) mark: Mark;
}
