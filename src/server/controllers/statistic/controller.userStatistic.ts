import { RatingStatus, Session, UserRole, UsersPlatformStatisticFields } from '@workquest/database-models/lib/models';
import { LoginApp } from '@workquest/database-models/lib/models/user/types';
import { BaseStatisticController } from './controller.baseStatistic';

export class UserStatisticController extends BaseStatisticController {
  static async registeredAction() {
    await this.writeActions({
      incrementFields: [
        UsersPlatformStatisticFields.Registered,
        UsersPlatformStatisticFields.Unfinished,
        UsersPlatformStatisticFields.SmsNotPassed,
        UsersPlatformStatisticFields.KycNotPassed
      ],
      statistic: 'user'
    });
  }

  static async finishedAction() {
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields.Finished,
      statistic: 'user'
    });
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields.Unfinished,
      statistic: 'user',
      type: 'decrement'
    });
  }

  static async loginAction(session: Session) {
    if (
      session.device.startsWith('Android') ||
      session.device.startsWith('iOS') ||
      session.device.startsWith('Dart')
    ) {
      await this.writeAction({
        incrementFields: session.app === LoginApp.App
          ? UsersPlatformStatisticFields.UseApp
          : UsersPlatformStatisticFields.UseWallet,
        statistic: 'user'
      });
    } else {
      await this.writeAction({
        incrementFields: UsersPlatformStatisticFields.UseWeb,
        statistic: 'user'
      });
    }
  }

  static async smsPassedAction() {
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields.SmsPassed,
      statistic: 'user'
    });
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields.SmsNotPassed,
      statistic: 'user',
      type: 'decrement'
    });
  }

  static async kycPassedAction() {
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields.KycPassed,
      statistic: 'user'
    });
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields.KycNotPassed,
      statistic: 'user',
      type: 'decrement'
    });
  }

  static async addSocialNetworkAction(network: string) {
    await this.writeAction({
      incrementFields: network,
      statistic: 'user'
    });
  }

  static async enableTOTPAction() {
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields.Use2FA,
      statistic: 'user'
    });
  }

  static async disableTOTPAction() {
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields.Use2FA,
      statistic: 'user',
      type: 'decrement'
    });
  }

  static async setRatingStatusAction(newStatus: RatingStatus, oldStatus: RatingStatus) {
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields[RatingStatus[newStatus]],
      statistic: 'user'
    });
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields[RatingStatus[oldStatus]],
      statistic: 'user',
      type: 'decrement'
    });
  }

  static async addRoleAction(role: UserRole) {
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields[role + 's'],
      statistic: 'user'
    });
  }

  static async changeRoleAction(newRole: UserRole) {
    const oldRole = newRole === UserRole.Worker ? UserRole.Employer : UserRole.Worker;

    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields[newRole + 's'],
      statistic: 'user'
    });
    await this.writeAction({
      incrementFields: UsersPlatformStatisticFields[oldRole + 's'],
      statistic: 'user'
    });
  }
}

