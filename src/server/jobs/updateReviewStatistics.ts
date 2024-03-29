import { UserStatisticController } from '../controllers/statistic/controller.userStatistic';
import { addJob } from '../utils/scheduler';
import { col, fn } from 'sequelize';
import {
  ControllerBroker,
  QuestNotificationActions
} from '../controllers/controller.broker';
import {
  Quest,
  QuestsReview,
  QuestStatus,
  RatingStatistic,
  RatingStatus,
  StatusKYC,
  User,
  UserRole
} from '@workquest/database-models/lib/models';

/**
 * 1 уровень Verified.
 *   Выполнить не менее 10 квестов.
 *   Каждый выполненный квест оценен не менее, чем на 3,5 балла.
 *   Средняя оценка у пользователя не менее, чем 3,5.
 *   Прохождение KYC (верифицированный аккаунт).
 *   Заполнение соцсетей (добавлено 1 соцсеть).
 *
 *  2 уровень Reliable.
 *    Выполнить не менее 20 квестов.
 *    Каждый выполненный квест оценен не менее, чем на 4 балла.
 *    Средняя оценка не менее 4.
 *    Прохождение KYC (верифицированный аккаунт).
 *    Верификация номера телефона.
 *    Заполнение соцсетей (добавлено 2 соцсети).
 *
 *  3 уровень Top Ranked.
 *    Выполнить не менее 30 квестов. Каждый выполненный квест не менее, чем на 4,5 балла.
 *    Средняя оценка не менее 4,5
 *    Прохождение KYC (верифицированный аккаунт).
 *    Верификация номера телефона.
 *    Заполнение соцсетей (добавлено 3 соцсети).
 *    Заполнение Employment information
 */

const brokerController = new ControllerBroker();

export interface StatisticPayload {
  userId: string;
}

export async function addUpdateReviewStatisticsJob(payload: StatisticPayload) {
  return addJob('updateReviewStatistics', payload);
}

type RatingConditions = {
  completedQuests: number;
  averageMark: number;
  socialNetworks: number;
};

const RatingConditions = class {
  constructor(public readonly user: User, public readonly completedQuestsCount: number, public readonly averageMark: number) {}

  public check(conditions: RatingConditions): boolean {
    const socialNetworks = Object.values(this.user['additionalInfo']['socialNetwork']).filter((network) => network !== null).length;

    return (
      this.completedQuestsCount >= conditions.completedQuests &&
      this.averageMark >= conditions.averageMark &&
      socialNetworks >= conditions.socialNetworks
    );
  }
};

function ratingStatus(user: User, completedQuestsCount: number, averageMark: number): RatingStatus {
  const thisUser = new RatingConditions(user, completedQuestsCount, averageMark);

  const topRankedConditions: RatingConditions = { completedQuests: 30, averageMark: 4.5, socialNetworks: 3 };
  const reliableConditions: RatingConditions = { completedQuests: 20, averageMark: 4, socialNetworks: 2 };
  const verifiedConditions: RatingConditions = { completedQuests: 10, averageMark: 3.5, socialNetworks: 1 };

  if (user.statusKYC !== StatusKYC.Confirmed) {
    return RatingStatus.NoStatus;
  }
  if (thisUser.check(verifiedConditions) && !user.phone) {
    return RatingStatus.Verified;
  }

  if (thisUser.check(topRankedConditions)) {
    return RatingStatus.TopRanked;
  }
  if (thisUser.check(reliableConditions)) {
    return RatingStatus.Reliable;
  }
  if (thisUser.check(verifiedConditions)) {
    return RatingStatus.Verified;
  }

  return RatingStatus.NoStatus;
}

export default async function (payload: StatisticPayload) {
  const [ratingStatistic] = await RatingStatistic.findOrCreate({
    include: { model: User, as: 'user' },
    where: { userId: payload.userId },
    defaults: { userId: payload.userId },
  });

  const user: User = ratingStatistic.user;

  const reviewCountPromise = QuestsReview.count({ where: { toUserId: user.id } });
  const averageMarkResultPromise = QuestsReview.findOne({
    attributes: [[fn('AVG', col('mark')), 'avgMark']],
    where: { toUserId: ratingStatistic.userId },
  });
  const completedQuestsCountPromise = Quest.count({
    where: {
      ...(user.role === UserRole.Employer && { userId: user.id }),
      ...(user.role === UserRole.Worker && { assignedWorkerId: user.id }),
      status: QuestStatus.Completed,
    },
  });

  const [reviewCount, completedQuestsCount, averageMarkResult] = await Promise.all([
    reviewCountPromise,
    completedQuestsCountPromise,
    averageMarkResultPromise,
  ]);

  const status = ratingStatus(user, completedQuestsCount, averageMarkResult.getDataValue('avgMark'));

  if (status !== ratingStatistic.status) {
    await UserStatisticController.setRatingStatusAction(status, ratingStatistic.status);

    brokerController.sendQuestNotification({
      action: QuestNotificationActions.updateRatingStatistic,
      recipients: [ratingStatistic.userId],
      data: ratingStatistic
    });
  }

  await ratingStatistic.update({
    status,
    reviewCount,
    averageMark: averageMarkResult.getDataValue('avgMark'),
  });
}
