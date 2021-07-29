import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo, BelongsToMany
} from "sequelize-typescript";
import { getUUID } from "../utils";
import { User } from "./User";

@Table
export class Chat extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID(), unique: true })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, defaultValue: "" })
  userId: string;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  membersId: any;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isPrivate: boolean;

  @BelongsTo(() => User, { foreignKey: "userId" }) user: User;
}
