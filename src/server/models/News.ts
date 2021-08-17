import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo, HasMany, BelongsToMany, Scopes
} from "sequelize-typescript";
import { getUUID } from "../utils";
import { User } from "./User";
import { Comment } from "./Comment";
import { Media } from "./Media";
import { NewsMedia } from "./NewsMedia";
import { LikeNews } from "./LikeNews";

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ["rootComments"]
    },
    include: [{
      model: Media.scope("urlOnly"),
      as: "medias",
      through: {
        attributes: []
      }
    }, {
      model: User.scope("short"),
      as: "userLikes",
      through: {
        attributes: []
      }
    }]
  },
  withRootComments: {
    include: [{
      model: Comment,
      as: "rootComments",
      where: { rootCommentId: null }
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
@Table({ paranoid: true })
export class News extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: false }) authorId: string;

  @Column({ type: DataType.TEXT, allowNull: false }) text: string;

  @BelongsTo(() => User) author: User;

  @HasMany(() => Comment) rootComments: Comment[];
  @HasMany(() => LikeNews) likes: LikeNews[];

  @BelongsToMany(() => Media, () => NewsMedia) medias: Media[];
  @BelongsToMany(() => User, () => LikeNews) userLikes: User[];
}
