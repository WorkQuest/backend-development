import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { getUUID } from '../utils';
import { User } from './User';

export enum ContentType {
  Image = 0,
  Video,
}

@Table
export class Media extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => User) @Column(DataType.STRING) userId: string;

  @Column({type: DataType.INTEGER, allowNull: false }) contentType: ContentType;
  @Column({type: DataType.STRING, allowNull: false }) url: string;
  @Column({type: DataType.STRING, allowNull: false }) hash: string;

  @BelongsTo(() => User) user: User;
}
