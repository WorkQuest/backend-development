import { BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Model, Scopes, Table } from "sequelize-typescript";
import { error, getUUID, totpValidate } from '../utils';
import * as bcrypt from "bcrypt";
import { Media } from "./Media";
import { Session } from "./Session";
import { Errors } from "../utils/errors";
import { Review } from "./Review";
import { RatingStatistic } from "./RatingStatistic";
import { StarredQuests } from "./StarredQuests";
import { News } from "./News";

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

export interface TOTP {
  confirmCode: string | null;
  active: boolean;
  secret: string | null;
}

export interface Security {
  TOTP: TOTP;
}

interface UserSettings {
  restorePassword: string | null;
  emailConfirm: string | null;
  phoneConfirm: string | null;
  social: UserSocialSettings;
  security: Security;
}

export const defaultUserSettings: UserSettings = {
  restorePassword: null,
  emailConfirm: null,
  phoneConfirm: null,
  social: {},
  security: {
    TOTP: {
      confirmCode: null,
      active: false,
      secret: null,
    }
  }
}

export enum UserStatus {
  Unconfirmed,
  Confirmed,
  NeedSetRole,
}

export enum UserRole {
  Employer = "employer",
  Worker = "worker",
}

export enum StatusKYC {
  Unconfirmed = 0,
  Confirmed,
}

interface SocialMediaNicknames {
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  facebook: string | null;
}

interface AdditionalInfo {
  description: string | null;
  secondMobileNumber: string | null;
  address: string | null;
  socialNetwork: SocialMediaNicknames;
}

interface Knowledge {
  from: string;
  to: string;
  place: string;
}

interface WorkExperience {
  from: string;
  to: string;
  place: string;
}

export interface AdditionalInfoWorker extends AdditionalInfo {
  skills: string[];
  educations: Knowledge[] | null;
  workExperiences: WorkExperience[] | null;
}

export interface AdditionalInfoEmployer extends AdditionalInfo {
  company: string | null;
  CEO: string | null;
  website: string | null;
}

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ["password", "settings", "tempPhone", "createdAt", "updatedAt"]
    },
    // include: [{
    //   model: Media.scope('urlOnly'),
    //   as: 'avatar'
    // }, {
    //   model: RatingStatistic,
    //   as: 'ratingStatistic'
    // }]
  },
  withPassword: {
    attributes: {
      include: ["password", "settings", "tempPhone"]
    }
  }
}))
@Table
export class User extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => Media) @Column({type: DataType.STRING, defaultValue: null}) avatarId: string;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      if (!value) {
        this.setDataValue("password", null);
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(value, salt);
      this.setDataValue("password", hash);
    },
    get() {
      return this.getDataValue("password");
    }
  }) password: string;

  @Column(DataType.STRING) firstName: string;
  @Column(DataType.STRING) lastName: string;
  @Column({ type: DataType.JSONB, defaultValue: {} }) additionalInfo: object;

  @Column({ type: DataType.STRING, unique: true }) email: string;
  @Column({ type: DataType.STRING, defaultValue: null }) role: UserRole;
  @Column({ type: DataType.JSONB, defaultValue: defaultUserSettings }) settings: UserSettings;
  @Column({ type: DataType.INTEGER, defaultValue: UserStatus.Unconfirmed }) status: UserStatus;
  @Column({ type: DataType.INTEGER, defaultValue: StatusKYC.Unconfirmed }) statusKYC: StatusKYC;

  @Column({type: DataType.STRING, defaultValue: null}) tempPhone: string;
  @Column({type: DataType.STRING, defaultValue: null}) phone: string;

  @BelongsTo(() => Media,{ constraints: false, foreignKey: 'avatarId' }) avatar: Media;

  @HasOne(() => RatingStatistic) ratingStatistic: RatingStatistic;

  @HasMany(() => News) idAuthor: News[];
  @HasMany(() => StarredQuests) starredQuests: StarredQuests[];
  @HasMany(() => Review, 'toUserId') reviews: Review[];
  @HasMany(() => Session) sessions: Session[];
  @HasMany(() => Media, { constraints: false }) medias: Media[];

  async passwordCompare(pwd: string): Promise<boolean> {
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

  mustHaveRole(role: UserRole) {
    if (this.role !== role) {
      throw error(Errors.InvalidRole, "User isn't match role", {
        current: this.role,
        mustHave: role
      });
    }
  }

  mustHaveActiveStatusTOTP(activeStatus: boolean) {
    if (this.settings.security.TOTP.active !== activeStatus) {
      throw error(Errors.InvalidActiveStatusTOTP,
        `Active status TOTP is not ${activeStatus ? "enable" : "disable"}`, {});
    }
  }

  validateTOTP(TOTP: string) {
    if (!totpValidate(TOTP, this.settings.security.TOTP.secret)) {
      throw error(Errors.Forbidden, "Invalid validate TOTP", {});
    }
  }
}

export function getDefaultAdditionalInfo(role: UserRole) {
  let additionalInfo: object = {
    description: null,
    secondMobileNumber: null,
    address: null,
    socialNetwork: {
      instagram: null,
      twitter: null,
      linkedin: null,
      facebook: null
    }
  };

  if (role === UserRole.Worker) {
    additionalInfo = {
      ...additionalInfo,
      skills: [],
      educations: [],
      workExperiences: []
    };
  } else if (role === UserRole.Employer) {
    additionalInfo = {
      ...additionalInfo,
      company: null,
      CEO: null,
      website: null
    };
  }

  return additionalInfo;
}
