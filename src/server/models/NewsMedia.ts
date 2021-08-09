import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { getUUID } from "../utils";
import { Media } from "./Media";
import { News } from "./News";

@Table
export class NewsMedia extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;

  @ForeignKey(() => Media)
  @Column({type: DataType.STRING, allowNull: false}) mediaId: string;

  @ForeignKey(() => News)
  @Column({type: DataType.STRING, allowNull: false}) newsId: string;

  @BelongsTo(() => Media) media: Media;
  @BelongsTo(() => News) news: News;
}
