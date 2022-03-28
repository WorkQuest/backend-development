import { Op, Transaction } from "sequelize";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import config from "../../config/config";
import { totpValidate } from "@workquest/database-models/lib/utils";
import { SkillsFiltersController } from "../controller.skillsFilters";
import {
  ChatsStatistic,
  defaultUserSettings,
  NetworkProfileVisibility,
  ProfileVisibilitySetting,
  Quest,
  QuestDispute,
  QuestsResponse, QuestsResponseStatus,
  QuestsStatistic,
  RatingStatistic,
  Session,
  User,
  UserRaiseStatus,
  UserRaiseView,
  UserRole,
  UserSpecializationFilter,
  UserStatus
} from "@workquest/database-models/lib/models";


export const onlyRegisteredUsersVisibility = [NetworkProfileVisibility.RegisteredUsers, NetworkProfileVisibility.SubmittingOffer]

abstract class UserHelper {
  public abstract user: User;

  public static getDefaultAdditionalInfo(role: UserRole) {
    let additionalInfo: object = {
      description: null,
      secondMobileNumber: null,
      address: null,
      socialNetwork: {
        instagram: null,
        twitter: null,
        linkedin: null,
        facebook: null,
      },
    };

    if (role === UserRole.Worker) {
      additionalInfo = {
        ...additionalInfo,
        skills: [],
        educations: [],
        workExperiences: [],
      };
    } else if (role === UserRole.Employer) {
      additionalInfo = {
        ...additionalInfo,
        company: null,
        CEO: null,
        website: null,
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
        social: { [network]: socialInfo },
      }),
    });

    await UserController.createStatistics(user.id);

    return user;
  }

  /** Checks list */
  public checkNotSeeYourself(userId: string): this {
    if (this.user.id === userId) {
      throw error(Errors.Forbidden, 'You can\'t see your profile (use "get me")', {});
    }

    return this;
  }

  public static async userMustExist(userId: string) {
    if (!(await User.findByPk(userId))) {
      throw error(Errors.NotFound, 'User does not exist', { userId });
    }
  }

  public static async usersMustExist(
    userIds: string[],
    scope: 'defaultScope' | 'short' | 'shortWithAdditionalInfo' = 'defaultScope',
  ): Promise<User[]> {
    const users = await User.scope(scope).findAll({
      where: { id: userIds },
    });

    if (users.length !== userIds.length) {
      const notFoundIds = userIds.filter((userId) => users.findIndex((user) => userId === user.id) === -1);

      throw error(Errors.NotFound, 'Users is not found', { notFoundIds });
    }

    return users;
  }

  public static async checkEmail(email: string) {
    const emailUsed = await User.findOne({ where: { email: { [Op.iLike]: email } } });

    if (emailUsed) {
      throw error(Errors.InvalidPayload, 'Email used', [{ field: 'email', reason: 'used' }]);
    }
  }

  public userMustHaveRole(role: UserRole): this {
    if (this.user.role !== role) {
      throw error(Errors.InvalidRole, "User isn't match role", {
        current: this.user.role,
        mustHave: role,
      });
    }

    return this;
  }

  public userMustHaveStatus(...statuses: UserStatus[]): this {
    if (!statuses.includes(this.user.status)) {
      throw error(Errors.InvalidStatus, "User status doesn't match", {
        current: this.user.status,
        mustHave: statuses,
      });
    }

    return this;
  }

  public userNeedsSetRole(): this {
    if (this.user.status !== UserStatus.NeedSetRole) {
      throw error(Errors.InvalidPayload, "User don't need to set role", {
        role: this.user.role,
      });
    }

    return this;
  }

  public async checkPassword(password): Promise<this> {
    if (!(await this.user.passwordCompare(password))) {
      throw error(Errors.Forbidden, 'User not found or password does not match', {});
    }

    return this;
  }

  public userMustHaveVerificationPhone(): this {
    if (!this.user.tempPhone) {
      throw error(Errors.InvalidPayload, 'User does not have verification phone', {});
    }

    return this;
  }

  public userMustHaveActiveStatusTOTP(activeStatus: boolean): this {
    if (this.user.settings.security.TOTP.active !== activeStatus) {
      throw error(Errors.InvalidActiveStatusTOTP, `Active status TOTP is not ${activeStatus ? 'enable' : 'disable'}`, {});
    }

    return this;
  }

  public checkPhoneConfirmationCode(code): this {
    if (this.user.settings.phoneConfirm !== code) {
      throw error(Errors.Forbidden, 'Confirmation code is not correct', {});
    }

    return this;
  }

  public checkTotpConfirmationCode(code): this {
    if (!totpValidate(code, this.user.settings.security.TOTP.secret)) {
      throw error(Errors.InvalidPayload, 'TOTP is invalid', [{ field: 'totp', reason: 'invalid' }]);
    }

    return this;
  }

  public checkActivationCodeTotp(code): this {
    if (this.user.settings.security.TOTP.confirmCode !== code) {
      throw error(Errors.InvalidPayload, 'Confirmation code is not correct', [
        {
          field: 'confirmCode',
          reason: 'invalid',
        },
      ]);
    }

    return this;
  }

  public checkUserAlreadyConfirmed(): this {
    if (!this.user.settings.emailConfirm) {
      throw error(Errors.UserAlreadyConfirmed, 'User already confirmed', {});
    }

    return this;
  }

  public checkUserConfirmationCode(confirmCode): this {
    if (this.user.settings.emailConfirm.toLowerCase() !== confirmCode.toLowerCase()) {
      throw error(Errors.InvalidPayload, 'Invalid confirmation code', [{ field: 'confirmCode', reason: 'invalid' }]);
    }

    return this;
  }

  public userMustBeDisputeMember(dispute: QuestDispute): this {
    const isUserDisputeMember = dispute.openDisputeUserId === this.user.id ? true : (dispute.opponentUserId === this.user.id);

    if (!isUserDisputeMember) {
      throw error(Errors.InvalidRole, 'User is not dispute member', [{userId: this.user.id}]);
    }
    return this;
  }

  public async createRaiseView() {
    await UserRaiseView.create({
      userId: this.user.id,
    });
  }

  private async checkWorkerProfileVisibility(visitor: User) {
    const quests = await Quest.findAll({
      where: { userId: visitor.id },
      include: [{
        model: QuestsResponse,
        as: 'response',
        where: { workerId: this.user.id, status: { [Op.ne]: QuestsResponseStatus.Rejected } },
        required: true,
      }]
    });

    if (quests.length === 0) throw error(Errors.Forbidden, 'User hide its profile', [{userId: this.user.id}]);
  }

  private async checkEmployerProfileVisibility(visitor: User) {
    const quests = await Quest.findAll({
      where: { userId: this.user.id, },
      include: [{
        model: QuestsResponse,
        as: 'response',
        where: { workerId: visitor.id, status: { [Op.ne]: QuestsResponseStatus.Rejected } },
        required: true,
      }]
    });

    if (quests.length === 0) throw error(Errors.Forbidden, 'User hide its profile', [{userId: this.user.id}]);
  }

  public async checkProfileVisibility(visibility: ProfileVisibilitySetting, visitor: User): Promise<this> {
    if (visibility.networkProfileVisibility === NetworkProfileVisibility.SubmittingOffer && this.user.role === UserRole.Employer) {
      await this.checkEmployerProfileVisibility(visitor);
    };

    if (visibility.networkProfileVisibility === NetworkProfileVisibility.SubmittingOffer && this.user.role === UserRole.Worker) {
      await this.checkWorkerProfileVisibility(visitor);
    };

    return this;
  }

  private async checkWorkerPriorityVisibility() {

  }

  private async checkEmployerPriorityVisibility() {

  }

  public async checkPriorityVisibility(visibility: ProfileVisibilitySetting, visitor: User): Promise<this> {


    return this;
  }

}

export class UserController extends UserHelper {
  constructor(public user: User) {
    super();

    if (!user) {
      throw error(Errors.NotFound, 'User not found', {});
    }
  }

  public async setRole(role: UserRole, transaction?: Transaction) {
    try {
      this.user = await this.user.update({
        status: UserStatus.Confirmed,
        role,
        additionalInfo: UserController.getDefaultAdditionalInfo(role),
      });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async setConfirmCodeToVerifyCodeNumber(confirmCode: number, transaction?: Transaction) {
    try {
      await this.user.update(
        {
          'settings.phoneConfirm': confirmCode,
        },
        { transaction },
      );
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
      }, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async changePassword(newPassword: string, transaction?: Transaction) {
    try {
      this.user = await this.user.update(
        {
          password: newPassword,
        },
        { transaction },
      );
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async logoutAllSessions(transaction?: Transaction) {
    try {
      await Session.update(
        { invalidating: true },
        {
          where: {
            userId: this.user.id,
            createdAt: { [Op.gte]: Date.now() - config.auth.jwt.refresh.lifetime * 1000 },
          },
          transaction,
        },
      );
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async setUserSpecializations(keys: string[], transaction?: Transaction) {
    try {
      await UserSpecializationFilter.destroy({
        where: { userId: this.user.id },
        transaction,
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

  public static async createStatistics(userId) {
    await RatingStatistic.findOrCreate({
      where: { userId: userId },
      defaults: { userId: userId },
    });
    await ChatsStatistic.findOrCreate({
      where: { userId: userId },
      defaults: { userId: userId },
    });
    await QuestsStatistic.findOrCreate({
      where: { userId: userId },
      defaults: { userId: userId },
    });
  }

  public get shortCredentials() {
    return {
      id: this.user.id,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      avatarId: this.user.avatarId,
      avatar: this.user.avatar,
      additionalInfo: this.user.additionalInfo,
    };
  }

  public async checkUserRaiseViewStatus() {
    const raiseView = await UserRaiseView.findOne({
      where: {
        userId: this.user.id,
        status: UserRaiseStatus.Paid
      }
    });

    if (raiseView) {
      throw error(Errors.AlreadyExists, "Raise view in progress", {raiseViewId: raiseView.id});
    }

    return this;
  }
}
