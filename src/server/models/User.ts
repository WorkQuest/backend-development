import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { getUUID } from '../utils';

@Table
export class User extends Model<User> {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
}
