import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo
} from "sequelize-typescript";
import { getUUID } from "../utils";
import { Message } from "./Message";
import { User } from "./User";

@Table
export class Favorite extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID(), unique: true })
  id: string;

  @ForeignKey(() => Message)
  @Column({ type: DataType.STRING, defaultValue: "" })
  messageId: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, defaultValue: "" })
  userId: string;

  @BelongsTo(() => Message, { foreignKey: "messageId" }) message: Message;
  @BelongsTo(() => User, { foreignKey: "userId" }) user: User;
}
