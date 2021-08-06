import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table
} from "sequelize-typescript";
import { getUUID } from '../utils';
import { User } from './User';
import { CommentMedia } from "./CommentMedia";

export enum ContentType {
  mp4 = 'video/mp4',
  jpeg = 'image/jpeg',
  png = 'image/png',
  pdf = 'application/pdf',
  DOC = 'application/msword'
}

@Table({
  scopes: {
    urlOnly: {
      attributes: ["id", "url"]
    }
  }
})
export class Media extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;

  @ForeignKey(() => User)
  @Column({type: DataType.STRING, allowNull: false}) userId: string;

  @Column({type: DataType.STRING, allowNull: false}) contentType: ContentType;
  @Column({type: DataType.TEXT, allowNull: false}) url: string;
  @Column({type: DataType.STRING, allowNull: false, defaultValue: null}) hash: string;

  @BelongsTo(() => User) user: User;
  @HasMany (()=> CommentMedia) idComment: CommentMedia[];
}
