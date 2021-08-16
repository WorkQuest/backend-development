import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
  BelongsTo,
  HasMany, BelongsToMany, Scopes
} from "sequelize-typescript";
import { getUUID } from "../utils";
import { User } from "./User";
import { News } from "./News";
import { CommentMedia } from "./CommentMedia";
import { Media } from "./Media";
import { LikeComment } from "./LikeComment";
import { LikeNews } from "./LikeNews";

@Scopes(() => ({
  defaultScope: {
    include: [{
      model: Media.scope("urlOnly"),
      as: "medias",
      through: {
        attributes: []
      }
    }, {
      model: User,
      as: "userLikes",
      through: {
        attributes: []
      }
    }]
  },
  withSubComments: {
    include: [{
      model: Comment,
      as: 'subComments'
    }, {
      model: Media.scope("urlOnly"),
      as: "medias",
      through: {
        attributes: []
      }
    }, {
      model: User,
      as: "userLikes",
      through: {
        attributes: []
      }
    }]
  }
}))
@Table
export class Comment extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: false }) authorId: string;

  @ForeignKey(() => News)
  @Column({ type: DataType.STRING, allowNull: false }) newsId: string;

  @ForeignKey(() => Comment)
  @Column(DataType.STRING) rootCommentId: string;

  @Column({ type: DataType.TEXT, allowNull: false }) text: string;

  @BelongsTo(() => User) author: User;
  @BelongsTo(() => News) news: News;
  @BelongsTo(() => Comment) rootComment: Comment;

  @HasMany(() => Comment) subComments: Comment[];
  @HasMany(() => LikeComment) likeComment: LikeComment[];

  @BelongsToMany(() => Media, () => CommentMedia) medias: Media[];
  @BelongsToMany(() => User, () => LikeComment) userLikes: User[];
}
