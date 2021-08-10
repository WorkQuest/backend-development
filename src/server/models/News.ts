import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo, HasMany, BelongsToMany, Scopes
} from "sequelize-typescript";
import { getUUID } from "../utils";
import { User } from "./User";
import { Comment } from "./Comment";
import { Media } from "./Media";
import { NewsMedia } from "./NewsMedia";

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ['rootComments']
    },
  },
  rootCommentsOnly: {
    attributes: {
      exclude: ['comments']
    },
    include: [{
      model: Comment,
      as: 'rootComments',
      where: {
        rootCommentId: null
      }
    },
      {
        model: Media.scope('urlOnly'),
        as: 'medias',
        through: {
          attributes: []
        }
      }]
  }
}))
@Table({paranoid: true})
export class News extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() })
  id: string;

  @ForeignKey(() => User)
  @Column({type: DataType.STRING, allowNull: false}) authorId: string;

  @Column({type: DataType.TEXT, allowNull: false}) text: string;

  @BelongsTo(() => User) author: User;

  @HasMany(() => Comment) rootComments: Comment[];4

  @BelongsToMany(() => Media, () => NewsMedia) medias: Media[];
}
