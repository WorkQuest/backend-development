import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo, BelongsToMany
} from "sequelize-typescript";
import { error, getUUID } from "../utils";
import { User } from "./User";
import { Chat } from "./Chat";
import { Media } from "./Media";
import { Errors } from "../utils/errors";

@Table
export class Message extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID(), unique: true })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, defaultValue: ""})
  userId: string;

  @ForeignKey(() => Chat)
  @Column({ type: DataType.STRING, defaultValue: "" })
  chatId: string;

  @ForeignKey(() => Media)
  @Column({ type: DataType.JSONB, defaultValue: [] })
  mediaId: any;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  usersDel: any;

  @Column({ type: DataType.STRING, defaultValue: "" })
  data: string;

  @BelongsTo(() => User, { foreignKey: "userId" }) user: User;
  @BelongsTo(() => Chat, { foreignKey: "chatId" }) chat: Chat;

  isAuthor(userId: String) {
    if (this.userId !== userId) {
      throw error(Errors.Forbidden, "User not an author of this message", {});
    }
  }

  isFromThisChat(chatId: String) {
    if (this.chatId !== chatId) {
      throw error(Errors.Forbidden, "This message not from this chat", {});
    }
  }
}
