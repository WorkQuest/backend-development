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
      exclude: ["rootComments","newsId","medias"]
    },
    include: {
      model: Media.scope("urlOnly"),
      as: "medias",
      through: {
        attributes: []
      }
    }
  },
  rootCommentsOnly: {
    attributes: {
      exclude: ["rootComments"]
    },
    include: [{
      model: Comment,
      as: "rootComments",
      where: {
        rootCommentId: null
      }
    },
      {
        model: Media.scope("urlOnly"),
        as: "medias",
        through: {
          attributes: []
        }
      },
      {
        model: LikeNews,
        as: "newsId"
      }
    ]
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
  @HasMany(() => LikeNews) newsId: LikeNews[];

  @BelongsToMany(() => Media, () => NewsMedia) medias: Media[];
}
