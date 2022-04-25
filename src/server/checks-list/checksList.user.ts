import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  User,
  UserRole,
  RatingStatistic,
  WorkerProfileVisibilitySetting
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
      .findOne({ where: { userId: comparableUser.id } }),
    ]);

    if (comparableUserVisibilitySetting.ratingStatusCanInviteMeOnQuest === RatingStatus.AllStatuses) {
      return this;
    }
    if (thisUserRatingStatistic.status !== comparableUserVisibilitySetting.ratingStatusCanInviteMeOnQuest) {
      throw error(Errors.InvalidStatus, "User rating does not match comparable user's profile visibility setting", {
        comparableUserSettings: {
          userId: comparableUser.id,
          ratingStatus: comparableUserVisibilitySetting.ratingStatusCanInviteMeOnQuest,
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
