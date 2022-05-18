import { col, fn } from 'sequelize';
import { addJob } from '../utils/scheduler';
import {
  Admin,
  QuestDisputeReview,
  AdminQuestDisputesStatistic,
} from "@workquest/database-models/lib/models";

export interface StatisticPayload {
  adminId: string;
}

export async function addUpdateDisputeReviewStatisticsJob(payload: StatisticPayload) {
  return addJob('updateDisputeReviewStatistics', payload);
}

export default async function (payload: StatisticPayload) {
  const [ratingStatistic] = await AdminQuestDisputesStatistic.findOrCreate({
    include: { model: Admin, as: 'admin' },
    where: { adminId: payload.adminId },
    defaults: { adminId: payload.adminId },
  });

  const admin: Admin = ratingStatistic.admin;

  const reviewCountPromise = QuestDisputeReview.count({ where: { toAdminId: admin.id } });
  const averageMarkResultPromise = QuestDisputeReview.unscoped().findOne({
    attributes: [[fn('AVG', col('mark')), 'avgMark']],
    where: { toAdminId: ratingStatistic.adminId },
  });

  const [reviewCount, averageMarkResult] = await Promise.all([
    reviewCountPromise,
    averageMarkResultPromise,
  ]);

  await ratingStatistic.update({
    reviewCount,
    averageMark: averageMarkResult.getDataValue('avgMark'),
  });
}
