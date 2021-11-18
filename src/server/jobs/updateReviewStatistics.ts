import { col, fn } from 'sequelize';
import { addJob } from "../utils/scheduler";
import {
  User,
  Quest,
  Review,
  UserRole,
  StatusKYC,
  QuestStatus,
  RatingStatus,
  RatingStatistic,
} from "@workquest/database-models/lib/models";

export interface StatisticPayload {
  userId: string,
}

export async function addUpdateReviewStatisticsJob(payload: StatisticPayload) {
  return addJob("updateReviewStatistics", payload);
}

type ConditionsType = {
  completedQuests: number,
  averageMark: number,
  socialNetworks: number,
}

function ratingStatus(user: User, completedQuestsCount: number, averageMark: number) {
  const check = function(conditions: ConditionsType): boolean {
    const socialNetworks = Object.values(user["additionalInfo.socialNetwork"])
      .filter(network => network !== null)
      .length;

    return completedQuestsCount >= conditions.completedQuests
      && averageMark >= conditions.averageMark
      && socialNetworks >= conditions.socialNetworks;
  }

  const topRankedConditions: ConditionsType = { completedQuests: 30, averageMark: 4.5, socialNetworks: 3 };
  const reliableConditions: ConditionsType = { completedQuests: 20, averageMark: 4, socialNetworks: 2 };
  const verifiedConditions: ConditionsType = { completedQuests: 10, averageMark: 3.5, socialNetworks: 1 };

  if (user.statusKYC !== StatusKYC.Confirmed) {
    return RatingStatus.noStatus;
  }
  if (check(verifiedConditions) && !user.phone) {
    return RatingStatus.verified;
  }

  if (check(topRankedConditions)) {
    return RatingStatus.topRanked;
  }
  if (check(reliableConditions)) {
    return RatingStatus.reliable;
  }

  return RatingStatus.noStatus;
}

export default async function(payload: StatisticPayload) {
  const [ratingStatistic, ] = await RatingStatistic.findOrCreate({
    include: [{
      model: User,
      as: 'user'
    }],
    where: { userId: payload.userId },
    defaults: { userId: payload.userId },
  });
  const user: User = ratingStatistic.user;

  const reviewCountPromise = Review.count({ where: { toUserId: user.id } });
  const averageMarkResultPromise = Review.findOne({
    attributes: [[fn('AVG', col('mark')), 'avgMark']],
    where: { toUserId: ratingStatistic.userId }
  });
  const completedQuestsCountPromise = Quest.count({
    where: {
      ...(user.role === UserRole.Employer && { userId: user.id }),
      ...(user.role === UserRole.Worker && { assignedWorkerId: user.id }),
      status: QuestStatus.Done,
    }
  });

  const [reviewCount, completedQuestsCount, averageMarkResult] = await Promise.all([
    reviewCountPromise,
    completedQuestsCountPromise,
    averageMarkResultPromise,
  ]);

  await ratingStatistic.update({
    averageMark: averageMarkResult.getDataValue('avgMark'),
    reviewCount,
    // status
  });
}
