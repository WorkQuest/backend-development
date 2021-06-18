import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './User';
import { Quest } from './Quest';
import { getUUID } from '../utils';

@Table
export class Review extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => Quest) @Column({type: DataType.STRING, allowNull: false}) questId: string;
  @ForeignKey(() => User) @Column({type: DataType.STRING, allowNull: false}) fromUserId: string;
  @ForeignKey(() => User) @Column({type: DataType.STRING, allowNull: false}) toUserId: string;

  @Column({type: DataType.TEXT, defaultValue: null }) message: string;
  @Column({type: DataType.INTEGER, allowNull: false }) mark: number;
}
