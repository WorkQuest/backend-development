import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo
} from 'sequelize-typescript';
import {getUUID} from "../utils";
import { User } from "./User";
import { News } from "./News";

@Table
export class LikesNews extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() })
  id: string;

  @ForeignKey(() => News)
  @Column ({type:DataType.STRING, defaultValue: ''})
  idNews: string;

  @ForeignKey(() => User)
  @Column ({ type:DataType.STRING, defaultValue:'' })
  idUser: any;

  @BelongsTo(() => News,) news: News;
  @BelongsTo(() => User,) members: User[];
}
