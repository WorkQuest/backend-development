import { Column, DataType, Model, Scopes, Table } from "sequelize-typescript";
import { getUUID } from "../utils";
import * as bcrypt from "bcrypt";

export interface SocialInfo {
  id: string;
  email: string;
  last_name: string;
  first_name: string;
}

export interface UserSocialSettings {
  google?: SocialInfo;
  facebook?: SocialInfo;
  twitter?: SocialInfo;
  linkedin?: SocialInfo;
}

interface UserSettings {
  emailConfirm: string | null;
  social: UserSocialSettings;
}

const defaultUserSettings: UserSettings = {
  emailConfirm: null,
  social: {},
}

export enum UserStatus {
  Unconfirmed,
  Confirmed
}

export enum UserRole {
  Employer = "employer",
  Worker = "worker"
}

export enum StatusKYC {
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
      if (!value) {
        this.setDataValue("password", null);
        return;
      }

      let salt = bcrypt.genSaltSync(10);
      let hash = bcrypt.hashSync(value, salt);
      this.setDataValue("password", hash);
    },
    get() {
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

  static async findWithEmail(email: string): Promise<User> {
    return await User.scope("withPassword").findOne({ where: { ["email"]: email } });
  }

  static async findWithSocialId(network: string, id: string): Promise<User> {
    return await User.scope("withPassword").findOne({
      where: {
        [`settings.social.${network}.id`]: id
      }
    });
  }
}
