import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { getUUID } from '../utils';
import { Media } from './Media';
import { Quest } from './Quest';

@Table
export class QuestMedia extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;

  @ForeignKey(() => Media) @Column({type: DataType.STRING, allowNull: false}) mediaId: string;
  @ForeignKey(() => Quest) @Column({type: DataType.STRING, allowNull: false}) questId: string;

  @BelongsTo(() => Media) media: Media;
  // @BelongsToMany(() => Quest) quest: Quest;
}
