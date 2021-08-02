import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { getUUID } from "../utils";
import { User } from "./User";
import { Message } from "./Message";

@Table
export class Favourite extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => User) @Column({type: DataType.STRING, allowNull: false}) userId: string;
  @ForeignKey(() => Message) @Column({type: DataType.STRING, allowNull: false}) messageId: string;

  @BelongsTo(() => User, {foreignKey: 'userId', targetKey: 'id'}) authorId: User;
  @BelongsTo(() => Message, {foreignKey: 'messageId', targetKey: 'id'}) message: Message;
}
