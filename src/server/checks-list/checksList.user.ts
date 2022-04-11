import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  ProfileVisibilitySetting, RatingStatus,
  User,
  UserRole
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

  public async ratingShouldCoincide(comparableUser: User): Promise<this> {
    const profileVisibility = await ProfileVisibilitySetting.findOne({ where: { userId: this.user.id } });

    if (profileVisibility.ratingStatus === RatingStatus.AllStatuses) {
      return this;
    }
    if (this.user.ratingStatistic.status !== profileVisibility.ratingStatus) {
      throw error(Errors.InvalidStatus, `User rating doesn't coincide to profile visibility setting of ${comparableUser.id}`, {
        userId: this.user.id,
        currentRatingStatus: this.user.ratingStatistic.status,
        coincideUserRatingStatus: profileVisibility.ratingStatus,
      });
    }

    return this;
  }
}
