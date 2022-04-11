import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  ProfileVisibilitySetting, RatingStatus,
  User,
  UserRole
} from "@workquest/database-models/lib/models";
import { RatingStatistic } from '@workquest/database-models/src/models/user/RatingStatistic';

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
}
