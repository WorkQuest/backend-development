import {
  Column, DataType, ForeignKey, Model, Table
} from "sequelize-typescript";
import {getUUID} from "../utils";
import {User} from "./User"

@Table
export class News extends Model {

  @Column({type: DataType.STRING, primaryKey: true, defaultValue: () => getUUID()})
  id!: string;

  @ForeignKey(() => User)
  @Column ({type:DataType.STRING, defaultValue: ''})
  idAuthor: string;

  @Column ({type: DataType.BOOLEAN})
  isNews: boolean;

  @Column({type:DataType.STRING, defaultValue: ''})
  text: string;

  @Column ({ type:DataType.JSONB, defaultValue: [] })
  likes: any;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  answers: any;

}
