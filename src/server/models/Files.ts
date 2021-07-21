import {
  BelongsTo,
  Column,
  DataType,
  Model,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { getUUID } from '../utils';
import { News } from './News';

export enum ContType {
  mp4 = 'video/mp4',
  jpeg = 'image/jpeg',
  png = 'image/png',
  pdf = 'application/pdf',
  DOC = 'application/msword'
}

@Table({
  scopes: {
    urlOnly: {
      attributes: ['id', 'url']
    }
  }
})
export class Files extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID(), unique: true }) id: string;

  @ForeignKey(() => News)
  @Column({ type: DataType.STRING, allowNull:  false, unique: true }) newsId: string;

  @Column({ type: DataType.STRING, allowNull: false }) contentType: ContType;
  @Column({ type: DataType.TEXT, allowNull: false }) url: string;
  @Column({ type: DataType.STRING, allowNull: false , defaultValue:null}) hash: string;

  @BelongsTo(() => News, {foreignKey: 'newsId', targetKey: 'id'}) baseNews: News;
}
