import { Column, DataType, Model, Scopes, Table } from "sequelize-typescript";
import { getUUID } from "../utils";
import * as bcrypt from "bcrypt";

interface UserSettings {
  emailConfirm: string | null;
}

const defaultUserSettings: UserSettings = {
  emailConfirm: null
};

export enum UserStatus {
  Unconfirmed,
  Confirmed
}

export enum UserRole {
  Employer = "employer",
  Worker = "worker"
}

export enum StatusKYC {
  Error = -1,
  Unconfirmed = 0,
  Confirmed,
}

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ["password", "avatar", "settings", "createdAt", "updatedAt"]
    }
  },
  withPassword: {
    attributes: {
      include: ["password", "settings"]
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

  @Column({ type: DataType.STRING, unique: true }) email: string;
  @Column(DataType.STRING) firstName: string;
  @Column(DataType.STRING) lastName: string;
  @Column(DataType.STRING) avatar: string;
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: null }) role: UserRole;
  @Column({ type: DataType.JSONB, defaultValue: defaultUserSettings }) settings: UserSettings;
  @Column({ type: DataType.INTEGER, defaultValue: UserStatus.Unconfirmed }) status: UserStatus;
  @Column({ type: DataType.INTEGER, defaultValue: StatusKYC.Unconfirmed }) statusKYC: StatusKYC;

  async passwordCompare(pwd: string) {
    return bcrypt.compareSync(pwd, this.password);
  }
}
