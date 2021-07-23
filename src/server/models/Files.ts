
import {
  BelongsTo,
  Column,
  DataType,
  Model,
  ForeignKey,
  Table
} from 'sequelize-typescript';
import { getUUID } from '../utils';
import { User } from './User';


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
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID()}) id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: false }) idUser: string;

  @Column({ type: DataType.STRING, allowNull: false }) contentType: ContType;
  @Column({ type: DataType.TEXT, allowNull: false }) url: string;
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: null }) hash: string;


  @BelongsTo(() => User) user: User;
}
