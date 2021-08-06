import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo, HasMany
} from "sequelize-typescript";
import {getUUID} from "../utils";
import {User} from "./User";
import { News } from "./News";
import { CommentMedia } from "./CommentMedia";

@Table({
  scopes: {
    idNewsOnly: {
      attributes: ["id", "idAuthor", "idNews", "idAnswer", "text", "updatedAt"]
    }
  }
})
export class Comments extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() })
  id: string;

  @ForeignKey(() => User)
  @Column ({type:DataType.STRING, defaultValue: ''})
  idAuthor: string;

  @ForeignKey(() => News)
  @Column ({type:DataType.STRING, defaultValue: ''})
  idNews: string;

  @ForeignKey(() => Comments)
  @Column ({type:DataType.STRING, defaultValue: null})
  idAnswer: string;

  @Column({type:DataType.TEXT, defaultValue: ''})
  text: string;

  @BelongsTo(() => User) author: User;
  @BelongsTo(() => News) news: News;
  @BelongsTo(() => Comments) commentId: Comments;
  @HasMany (() => Comments,{onDelete: 'cascade', hooks:true}) comment: Comments
  @HasMany (() => CommentMedia,{onDelete: 'cascade', hooks:true}) file: CommentMedia
}
