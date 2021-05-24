import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './User';
import { Quest } from './Quest';
import { getUUID } from '../utils';

export enum QuestsResponseStatus {
  Open = 0,
  Reject,
  Accept,
};

export enum QuestsResponseType {
  Response = 0,
  Invite,
};

@Table
export class QuestsResponse extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;

  @ForeignKey(() => User) @Column(DataType.STRING) userId: string;
  @ForeignKey(() => Quest) @Column(DataType.STRING) questId: string;

  @Column({type: DataType.INTEGER, defaultValue: QuestsResponseStatus.Open }) status: QuestsResponseStatus;
  @Column({type: DataType.INTEGER, defaultValue: QuestsResponseType.Response }) type: QuestsResponseType;

  @Column({type: DataType.TEXT }) message: string;

  @BelongsTo(() => User) user: User;
  @BelongsTo(() => Quest) quest: Quest;
}
