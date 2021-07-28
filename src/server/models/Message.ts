import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { error, getUUID } from '../utils';
import { User } from './User';
import { Chat } from "./Chat";


@Table
export class Message extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => User)
  @Column({type: DataType.STRING, allowNull: false}) userId: string;

  @Column({type: DataType.STRING, allowNull: false }) data: string;

  @Column ({ type:DataType.JSONB, defaultValue: [] }) membersDel: any;

  @Column ({ type:DataType.JSONB, defaultValue: [] }) media: any;


  @ForeignKey(() => Chat)
  @Column({type: DataType.STRING, allowNull: false}) chatId: string;
  @BelongsTo(() => User) user: User;
  @BelongsTo(() => Chat) chat: Chat;
}
