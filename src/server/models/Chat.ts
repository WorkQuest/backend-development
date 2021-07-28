import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { error, getUUID } from '../utils';
import { User } from './User';


@Table
export class Chat extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => User)
  @Column({type: DataType.STRING, allowNull: false}) userId: string;

  @Column ({ type:DataType.JSONB, defaultValue: [] }) members: any;

  @Column({type: DataType.STRING, allowNull: true }) name: string;

  @Column ({type: DataType.BOOLEAN}) isPrivate: boolean;

  @BelongsTo(() => User) users: User;
}
