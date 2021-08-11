import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo
} from 'sequelize-typescript';
import {getUUID} from "../utils";
import { User } from "./User";
import { Comment } from "./Comment";

@Table
export class LikeComment extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() })
  id: string;

  @ForeignKey(() => Comment)
  @Column ({type:DataType.STRING, allowNull: false}) commentId: string;

  @ForeignKey(() => User)
  @Column ({type:DataType.STRING, allowNull: false}) userId: string;

  @BelongsTo(() => Comment) likeComment: Comment;
  @BelongsTo(() => User) user: User;
}
