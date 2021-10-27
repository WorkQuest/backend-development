import {Transaction} from "sequelize";
import {error} from "../utils";
import {Errors} from '../utils/errors';
import {getMedia} from "../utils/medias";
import {keysToRecords} from "../utils/filters";
import {totpValidate} from "@workquest/database-models/lib/utils";
import {
  User,
  UserRole,
  UserStatus,
  RatingStatistic,
  defaultUserSettings,
  UserSpecializationFilter,
} from "@workquest/database-models/lib/models";

abstract class CheckList {
  protected abstract _user: User;

  protected abstract _rollbackTransaction();

  protected async _checkModel(): Promise<void | never> {
    if (!this._user) {
      await this._rollbackTransaction();

      throw error(Errors.NotFound, "Model User not found", {});
    }
  }

  public async userMustHaveRole(role: UserRole): Promise<void | never> {
    await this._checkModel();

    if (this._user.role !== role) {
      await this._rollbackTransaction();

      throw error(Errors.InvalidRole, "User isn't match role", {
        current: this._user.role, mustHave: role,
      });
    }
  }

  public async userNeedsSetRole(): Promise<void | never> {
    await this._checkModel();

    if (this._user.status !== UserStatus.NeedSetRole) {
      await this._rollbackTransaction();

      throw error(Errors.InvalidPayload, "User don't need to set role", {
        role: this._user.role,
      });
    }
  }

  public async checkPassword(password): Promise<void | never> {
    await this._checkModel();

    if (!(await this._user.passwordCompare(password))) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, 'User not found or password does not match', {});
    }
  }

  public async userMustHaveVerificationPhone(): Promise<void | never> {
    await this._checkModel();

    if (!this._user.tempPhone) {
      await this._rollbackTransaction();

      throw error(Errors.InvalidPayload, 'User does not have verification phone', {});
    }
  }

  public async userMustHaveActiveStatusTOTP(activeStatus: boolean): Promise<void | never> {
    await this._checkModel();

    if (this._user.settings.security.TOTP.active !== activeStatus) {
      await this._rollbackTransaction();

      throw error(Errors.InvalidActiveStatusTOTP,
        `Active status TOTP is not ${activeStatus ? "enable" : "disable"}`, {});
    }
  }

  public async checkPhoneConfirmationCode(code) {
    await this._checkModel();

    if (this._user.settings.phoneConfirm !== code) {
      await this._rollbackTransaction();

      throw error(Errors.Forbidden, 'Confirmation code is not correct', {});
    }
  }

  public async checkTotpConfirmationCode(code): Promise<void | never> {
    await this._checkModel();

    if (!totpValidate(code, this._user.settings.security.TOTP.secret)) {
      await this._rollbackTransaction();

      throw error(Errors.InvalidPayload, "TOTP is invalid", [{ field: "totp", reason: "invalid" }]);
    }
  }

  public async checkActivationCodeTotp(code) {
    await this._checkModel();

    if (this._user.settings.security.TOTP.confirmCode !== code) {
      this._rollbackTransaction();

      throw error(Errors.InvalidPayload, "Confirmation code is not correct", [{
        field: "confirmCode",
        reason: "invalid"
      }]);
    }
  }

  public async checkUserAlreadyConfirmed() {
    await this._checkModel();

    if (!this._user.settings.emailConfirm) {
      this._rollbackTransaction();

      throw error(Errors.UserAlreadyConfirmed, "User already confirmed", {});
    }
  }

  public async checkUserConfirmationCode(confirmCode) {
    await this._checkModel();

    if (this._user.settings.emailConfirm.toLowerCase() !== confirmCode.toLowerCase()) {
      this._rollbackTransaction();

      throw error(Errors.InvalidPayload, "Invalid confirmation code", [{ field: "confirmCode", reason: "invalid" }]);
    }
  }
}

export class UserController extends CheckList {
  protected readonly _userId: string;

  protected _user: User;

  protected _transaction: Transaction;

  constructor(userId, user?: User, transaction?: Transaction) {
    super();

    this._userId = userId;

    if (user) {
      this.setModel(user);
    }
    if (transaction) {
      this.setTransaction(transaction);
    }
  }

  protected _rollbackTransaction(): Promise<void> {
    if (this._transaction) return this._transaction.rollback();
  }

  public setModel(user: User) {
    this._user = user;
  }

  public async findModel(): Promise<User> {
    if (this._user) return this._user;

    const user = await User.findByPk(this._userId);

    if (!user) {
      throw error(Errors.NotFound, "User not found", {
        userId: this._userId,
      });
    }

    this._user = user;

    return user;
  }

  public setTransaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  public async setAvatar(mediaId?: string): Promise<void | never> {
    await this._checkModel();

    if (mediaId) {
      const media = await getMedia(mediaId, this._transaction);

      this._user.avatarId = media.id;
    } else {
      this._user.avatarId = null;
    }

    await this._user.save({ transaction: this._transaction });
  }

  public async setUserSpecializations(keys?: string[]) {
    await UserSpecializationFilter.destroy({
      where: { userId: this._user.id },
      transaction: this._transaction,
    });

    if (!keys) {
      return;
    }

    const userSpecializations = keysToRecords(keys, 'userId', this._userId);

    await UserSpecializationFilter.bulkCreate(userSpecializations, { transaction: this._transaction });
  }

  public static getDefaultAdditionalInfo(role: UserRole) {
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

  public static async getUserByNetworkProfile(network: string, profile): Promise<User> {
    const foundUserBySocialId = await User.findWithSocialId(network, profile.id);

    if (foundUserBySocialId) {
      return foundUserBySocialId;
    }

    const foundUserByEmail = await User.findWithEmail(profile.email);

    const socialInfo = {
      id: profile.id,
      email: profile.email,
      last_name: profile.name.last,
      first_name: profile.name.first,
    };

    if (foundUserByEmail) {
      await foundUserByEmail.update({ [`settings.social.${network}`]: socialInfo });

      return foundUserByEmail;
    }

    const user = await User.create({
      password: null,
      firstName: profile.name.first,
      lastName: profile.name.last,
      status: UserStatus.NeedSetRole,
      email: profile.email.toLowerCase(),
      settings: Object.assign({}, defaultUserSettings, {
        social: { [network]: socialInfo }
      })
    });

    await RatingStatistic.create({ userId: user.id });

    return user;
  }
}
