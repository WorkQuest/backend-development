import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './User';
import { Quest } from './Quest';
import { getUUID } from '../utils';

@Table
export class QuestsResponse extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;

  @ForeignKey(() => User) @Column(DataType.STRING) userId: string;
  @ForeignKey(() => Quest) @Column(DataType.STRING) questId: string;

  @ForeignKey(() => User) @Column(DataType.TEXT) message: string;

  @BelongsTo(() => User) user: User;
  @BelongsTo(() => Quest) quest: Quest;
}
