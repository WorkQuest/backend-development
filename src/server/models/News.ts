import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo, BelongsToMany
} from 'sequelize-typescript';
import {getUUID} from "../utils";
import {User} from "./User"
import { Files } from './Files';

@Table
export class News extends Model {
  @ForeignKey(() => Files)
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID(),unique: true  })
  id: string;

  @ForeignKey(() => User)
  @Column ({type:DataType.STRING, defaultValue: ''})
  idAuthor: string;

  @Column ({type: DataType.BOOLEAN})
  checkNews: boolean;

  @Column({type:DataType.STRING, defaultValue: ''})
  text: string;

  @Column ({ type:DataType.JSONB, defaultValue: [] })
  likes: any;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  answers: any;

}
