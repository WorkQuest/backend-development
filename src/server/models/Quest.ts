import { BelongsTo, Column, DataType, ForeignKey, Model, Scopes, Table } from 'sequelize-typescript';
import { User } from "./User";
import { getUUID } from '../utils';

export enum Priority {
  AllPriority = 0,
  Low,
  Normal,
  Urgent,
};

export enum AdType {
  Free = 0,
  Paid,
};

/* TODO
* Ограничение по размеру строк (title, description)
* Price - валидация цены (количество знаков после запятой)
* Address - формат
*/

@Table
export class Quest extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => User) @Column(DataType.STRING) userId: string;

  @Column({type: DataType.INTEGER, defaultValue: Priority.AllPriority }) priority: Priority;
  @Column({type: DataType.STRING, validate: { notEmpty: true } }) category;

  @Column({type: DataType.STRING, validate: { notEmpty: true } }) address; /*TODO */
  @Column({type: DataType.STRING, validate: { notEmpty: true } }) title;
  @Column({type: DataType.STRING }) description;

  @Column({type: DataType.DECIMAL, validate: { notEmpty: true } }) price; /*TODO */
  @Column({type: DataType.INTEGER, defaultValue: AdType.Free }) adType: AdType;

  @BelongsTo(() => User) user: User;
}
