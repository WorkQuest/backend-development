import { addJob } from "../utils/scheduler";
import {
  RatingStatistic,
  Review,
} from "@workquest/database-models/lib/models";
import { col, fn } from 'sequelize';

export interface StatisticPayload {
  ratingStatisticId: string,
}

export async function addUpdateReviewStatisticsJob(payload: StatisticPayload) {
  return addJob("updateReviewStatistics", payload);
}

export default async function(payload: StatisticPayload) {
  const  [ ratingStatistic ] = await RatingStatistic.findOrCreate( { where: { id: payload.ratingStatisticId } });

  const reviewCountPromise = Review.count({ where: { toUserId: ratingStatistic.userId } });
  const averageMarkResultPromise = Review.findOne({
      attributes: [[fn('AVG', col('mark')), 'avgMark']],
      where: { toUserId: ratingStatistic.userId   }
  });
  const [reviewCount, averageMarkResult] = await Promise.all([reviewCountPromise, averageMarkResultPromise]);

  await ratingStatistic.update({
    averageMark: averageMarkResult.getDataValue('avgMark'),
    reviewCount,
  });
}
