import {
  Column, DataType, ForeignKey, Model, Table, BelongsTo, BelongsToMany
} from 'sequelize-typescript';
import {getUUID} from "../utils";
import {User} from "./User"
import { Media } from "./Media";

@Table
export class News extends Model {
  @ForeignKey(() => Media)
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID(),unique: true  })
  id: string;

  @ForeignKey(() => User)
  @Column ({type:DataType.STRING, defaultValue: '',unique: true})
  idAuthor: string;

  @Column ({type: DataType.BOOLEAN})
  checkNews: boolean;

  @Column({type:DataType.STRING, defaultValue: ''})
  text: string;

  @Column ({ type:DataType.JSONB, defaultValue: [] })
  likes: any;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  answers: any;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  file: any;

}
