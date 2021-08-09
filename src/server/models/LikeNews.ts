import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo
} from 'sequelize-typescript';
import {getUUID} from "../utils";
import { User } from "./User";
import { News } from "./News";

@Table
export class LikeNews extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() })
  id: string;

  @ForeignKey(() => News)
  @Column ({type:DataType.STRING, allowNull: false}) newsId: string;

  @ForeignKey(() => User)
  @Column ({type:DataType.STRING, allowNull: false}) userId: string;

  @BelongsTo(() => News) news: News;
  @BelongsTo(() => User) user: User;
}
