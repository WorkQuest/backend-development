import { Op, Transaction } from "sequelize";
import {error} from "../../utils";
import {Errors} from '../../utils/errors';
import config from "../../config/config";
import {totpValidate} from "@workquest/database-models/lib/utils";
import {SkillsFiltersController} from "../controller.skillsFilters";
import {
  User,
  UserRole,
  UserStatus,
  RatingStatistic,
  defaultUserSettings,
  UserSpecializationFilter, Session
} from "@workquest/database-models/lib/models";

abstract class UserHelper {
  public abstract user: User

  public async setUserSpecializations(keys: string[], transaction?: Transaction) {
    try {
      await UserSpecializationFilter.destroy({
        where: { userId: this.user.id }, transaction,
      });

      if (keys.length <= 0) {
        return;
      }

      const skillsFiltersController = await SkillsFiltersController.getInstance();
      const userSpecializations = skillsFiltersController.keysToRecords(keys, 'userId', this.user.id);

      await UserSpecializationFilter.bulkCreate(userSpecializations, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
        throw e;
      }
    }
  }

  public async logoutAllSessions(transaction?: Transaction) {
    try {
      await Session.update({ invalidating: true }, {
        where: {
          userId: this.user.id,
          createdAt: { [Op.gte]: Date.now() - config.auth.jwt.refresh.lifetime * 1000 },
        }, transaction,
      });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
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

  /** Checks list */
  public checkNotSeeYourself(userId: string) {
    if (this.user.id === userId) {
      throw error(Errors.Forbidden, 'You can\'t see your profile (use "get me")', {});
    }

    return this;
  }

  public static async usersMustExist(userIds: string[]) {
   const users = await User.findAll({
      where: { id: userIds }
   });

    if (users.length !== userIds.length) {
      const notFoundIds = userIds.filter(id =>
        users.findIndex(user => id === user.id) === -1
      );

      throw error(Errors.NotFound, 'Users is not found', { notFoundIds });
    }
  }

  public static async checkEmail(email: string) {
    const emailUsed = await User.findOne({ where: { email: { [Op.iLike]: email } } });

    if (emailUsed) {
      throw error(Errors.InvalidPayload, "Email used", [{ field: "email", reason: "used" }]);
    }
  }

  public userMustHaveRole(role: UserRole): UserHelper {
    if (this.user.role !== role) {
      throw error(Errors.InvalidRole, "User isn't match role", {
        current: this.user.role, mustHave: role,
      });
    }

    return this;
  }

  public userNeedsSetRole(): UserHelper {
    if (this.user.status !== UserStatus.NeedSetRole) {
      throw error(Errors.InvalidPayload, "User don't need to set role", {
        role: this.user.role,
      });
    }

    return this;
  }

  public async checkPassword(password): Promise<UserHelper> {
    if (!(await this.user.passwordCompare(password))) {
      throw error(Errors.Forbidden, 'User not found or password does not match', {});
    }

    return this;
  }

  public userMustHaveVerificationPhone(): UserHelper {
    if (!this.user.tempPhone) {
      throw error(Errors.InvalidPayload, 'User does not have verification phone', {});
    }

    return this;
  }

  public userMustHaveActiveStatusTOTP(activeStatus: boolean): UserHelper {
    if (this.user.settings.security.TOTP.active !== activeStatus) {
      throw error(Errors.InvalidActiveStatusTOTP,
        `Active status TOTP is not ${activeStatus ? "enable" : "disable"}`, {});
    }

    return this;
  }

  public checkPhoneConfirmationCode(code): UserHelper {
    if (this.user.settings.phoneConfirm !== code) {
      throw error(Errors.Forbidden, 'Confirmation code is not correct', {});
    }

    return this;
  }

  public checkTotpConfirmationCode(code): UserHelper {
    if (!totpValidate(code, this.user.settings.security.TOTP.secret)) {
      throw error(Errors.InvalidPayload, "TOTP is invalid", [{ field: "totp", reason: "invalid" }]);
    }

    return this;
  }

  public checkActivationCodeTotp(code): UserHelper {
    if (this.user.settings.security.TOTP.confirmCode !== code) {
      throw error(Errors.InvalidPayload, "Confirmation code is not correct", [{
        field: "confirmCode",
        reason: "invalid"
      }]);
    }

    return this;
  }

  public checkUserAlreadyConfirmed(): UserHelper {
    if (!this.user.settings.emailConfirm) {
      throw error(Errors.UserAlreadyConfirmed, "User already confirmed", {});
    }

    return this;
  }

  public checkUserConfirmationCode(confirmCode): UserHelper {
    if (this.user.settings.emailConfirm.toLowerCase() !== confirmCode.toLowerCase()) {
      throw error(Errors.InvalidPayload, "Invalid confirmation code", [{ field: "confirmCode", reason: "invalid" }]);
    }

    return this;
  }
}

export class UserController extends UserHelper {

  constructor(
    public user: User
  ) {
    super();

    if (!user) {
      throw error(Errors.NotFound, "User not found", {});
    }
  }

  public async setRole(role: UserRole, transaction?: Transaction) {
    try {
      this.user = await this.user.update({
        status: UserStatus.Confirmed, role,
        additionalInfo: UserController.getDefaultAdditionalInfo(role),
      });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async setUnverifiedPhoneNumber(phoneNumber: string, confirmCode: number, transaction?: Transaction) {
    try {
      await this.user.update({
        tempPhone: phoneNumber,
        'settings.phoneConfirm': confirmCode,
      }, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async confirmPhoneNumber(transaction?: Transaction) {
    try {
      this.user = await this.user.update({
        phone: this.user.tempPhone,
        tempPhone: null,
        'settings.phoneConfirm': null,
      });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async changePassword(newPassword: String, transaction?: Transaction) {
    try {
      this.user = await this.user.update({
        password: newPassword
      }, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }
}