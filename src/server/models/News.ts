import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo, Scopes, HasMany
} from "sequelize-typescript";
import { getUUID } from "../utils";
import { User } from "./User";
import { Comments } from "./Comment";
import { CommentMedia } from "./CommentMedia";


@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ["updatedAt"]
    },
    include: [{
      model: Comments.scope("idNewsOnly"),
      as: "comment"
    }, {
      model: CommentMedia,
      as: "mediaCom"
    }]
  }
}))
@Table
export class News extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING})
  idAuthor: string;

  @Column({ type: DataType.BOOLEAN })
  checkNews: boolean;

  @Column({ type: DataType.TEXT, defaultValue: "" })
  text: string;


  @BelongsTo(() => User) author: User;
  @HasMany(() => Comments, {onDelete: 'cascade', hooks:true}) comment: Comments[];
  @HasMany(() => CommentMedia, {onDelete: 'cascade', hooks:true}) mediaCom: CommentMedia[];
}
