import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { getUUID } from '../utils';
import { Media } from "./Media";
import { Comment } from "./Comment";


@Table
export class CommentMedia extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() })
  id: string;

  @ForeignKey(() => Media)
  @Column({type: DataType.STRING, allowNull: false}) mediaId: string;

  @ForeignKey(() => Comment)
  @Column ({type:DataType.STRING, allowNull: false}) commentId: string;

  @BelongsTo(() => Media) media: Media;
  @BelongsTo(() => Comment) comment: Comment;
}
