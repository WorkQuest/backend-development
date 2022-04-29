import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  User,
  UserRole,
  UserStatus,
  RatingStatus,
  RatingStatistic,
  WorkerProfileVisibilitySetting,
  EmployerProfileVisibilitySetting,
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

  public async checkWorkerRatingMustMatchEmployerVisibilitySettings(employer: User): Promise<this> {
    const [workerRatingStatistic, employerVisibilitySetting] = await Promise.all([
      RatingStatistic.findOne({ where: { userId: this.user.id } }),
      EmployerProfileVisibilitySetting.findOne({ where: { userId: employer.id } }),
    ]);

    if ((employerVisibilitySetting.ratingStatusCanRespondToQuest & workerRatingStatistic.status) <= 0) {
      throw error(Errors.InvalidStatus, "Worker rating does not match employer's profile visibility setting", {
        employerSettings: {
          userId: employer.id,
          ratingStatus: employerVisibilitySetting.ratingStatusCanRespondToQuest,
        },
        workerRating: {
          userId: this.user.id,
          status: workerRatingStatistic.status,
        },
      });
    }

    return this;
  }

  public async checkEmployerRatingMustMatchWorkerVisibilitySettings(worker: User): Promise<this> {
    const [workerRatingStatistic, employerVisibilitySetting] = await Promise.all([
      RatingStatistic.findOne({ where: { userId: this.user.id } }),
      WorkerProfileVisibilitySetting.findOne({ where: { userId: worker.id } }),
    ]);

    if ((employerVisibilitySetting.ratingStatusCanInviteMeOnQuest & workerRatingStatistic.status) <= 0) {
      throw error(Errors.InvalidStatus, "Worker rating does not match employer's profile visibility setting", {
        employerSettings: {
          userId: worker.id,
          ratingStatus: employerVisibilitySetting.ratingStatusCanInviteMeOnQuest,
        },
        workerRating: {
          userId: this.user.id,
          status: workerRatingStatistic.status,
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
