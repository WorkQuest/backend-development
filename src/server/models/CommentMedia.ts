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
import { Comments } from "./Comment";
import { News } from "./News";


@Table
export class CommentMedia extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() })
  id: string;

  @ForeignKey(() => Media)
  @Column({type: DataType.STRING, allowNull: false})
  idMedia: string;

  @ForeignKey(() => Comments)
  @Column({type: DataType.STRING, allowNull: false, defaultValue: null})
  idComment: string;

  @ForeignKey(() => News)
  @Column({type: DataType.STRING, allowNull: false, defaultValue: null})
  idNews: string;

  @BelongsTo(() => Media) idMedias: Media;
  @BelongsTo(() => Comments) idComments:Comments;
  @BelongsTo(() => News) newsId: News;
}
