import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  Scopes,
  Table
} from 'sequelize-typescript';
import { error, getUUID } from '../utils';
import * as bcrypt from "bcrypt";
import { Media } from './Media';
import { Session } from './Session';
import { Errors } from '../utils/errors';
import { Review } from './Review';
import { RatingStatistic } from './RatingStatistic';
import { StarredQuests } from './StarredQuests';

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
  restorePassword: string | null;
  emailConfirm: string | null;
  social: UserSocialSettings;
}

const defaultUserSettings: UserSettings = {
  restorePassword: null,
  emailConfirm: null,
  social: {},
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
  firstMobileNumber: string | null;
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
  description: string | null;
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
      exclude: ["password", "avatarId", "settings", "createdAt", "updatedAt"]
    },
    include: [{
      model: Media.scope('urlOnly'),
      as: 'avatar'
    }, {
      model: RatingStatistic,
      as: 'ratingStatistic'
    }]
  },
  withPassword: {
    attributes: {
      include: ["password", "settings"]
    }
  }
}))
@Table({ paranoid: true })
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

  @BelongsTo(() => Media,{ constraints: false, foreignKey: 'avatarId' }) avatar: Media;

  @HasOne(() => RatingStatistic) ratingStatistic: RatingStatistic;

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
}
