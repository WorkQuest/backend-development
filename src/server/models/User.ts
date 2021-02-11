import { Column, DataType, Model, Scopes, Table } from 'sequelize-typescript';
import { getUUID } from '../utils';
import * as bcrypt from "bcrypt";

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ['password']
    }
  },
  withPassword: {
    attributes: {
      include: ['password']
    }
  }
}))
@Table
export class User extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @Column({
    type: DataType.STRING,
    set(value: string) {
      let salt = bcrypt.genSaltSync(10);
      let hash = bcrypt.hashSync(value, salt);
      // @ts-ignore
      this.setDataValue("password", hash);
    },
    get() {
      // @ts-ignore
      return this.getDataValue("password");
    }
  }) password: string;

  async passwordCompare(pwd: string) {
    return bcrypt.compareSync(pwd, this.password);
  }
}
