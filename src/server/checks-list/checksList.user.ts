import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  User,
  UserRole,
  UserStatus,
  RatingStatus,
  RatingStatistic,
  ProfileVisibilitySetting,
} from "@workquest/database-models/lib/models";

export class ChecksListUser {
  constructor(
    public readonly user: User,
  ) {
  }

  public checkUserRole(role: UserRole): this | never {
    if (this.user.role !== role) {
      throw error(Errors.InvalidStatus, "User role doesn't match", {
        current: this.user.role,
        mustHave: role,
      });
    }

    return this;
  }

  public async checkRatingMustMatchVisibilitySettings(comparableUser: User): Promise<this> {
    const [thisUserRatingStatistic, comparableUserVisibilitySetting] = await Promise.all([
      RatingStatistic.findOne({ where: { userId: this.user.id } }),
      ProfileVisibilitySetting.findOne({ where: { userId: comparableUser.id } }),
    ]);

    if (comparableUserVisibilitySetting.ratingStatus === RatingStatus.AllStatuses) {
      return this;
    }
    if (thisUserRatingStatistic.status !== comparableUserVisibilitySetting.ratingStatus) {
      throw error(Errors.InvalidStatus, "User rating does not match comparable user's profile visibility setting", {
        comparableUserSettings: {
          userId: comparableUser.id,
          ratingStatus: comparableUserVisibilitySetting.ratingStatus,
        },
        userRating: {
          userId: this.user.id,
          status: thisUserRatingStatistic.status,
        },
      });
    }

    return this;
  }

  public checkUserStatus(...statuses: UserStatus[]): this {
    if (!statuses.includes(this.user.status)) {
      throw error(Errors.InvalidStatus, "User status doesn't match", {
        current: this.user.status,
        mustHave: statuses,
      });
    }

    return this;
  }

  public checkEmailConfirmCode(confirmCode: string): this {
    if (!this.user.settings.emailConfirm) {
      throw error(Errors.InvalidDate, 'Email verification code is empty', {});
    }
    if (this.user.settings.emailConfirm.toLowerCase() !== confirmCode.toLowerCase()) {
      throw error(Errors.InvalidPayload, 'Invalid confirmation code', [{ field: 'confirmCode', reason: 'invalid' }]);
    }

    return this;
  }
}
