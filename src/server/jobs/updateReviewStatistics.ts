import { addJob } from "../utils/scheduler";
import { Quest, RatingStatistic, Review, StatusKYC, User, UserRole, RatingStatus } from "@workquest/database-models/lib/models";
import { col, fn } from "sequelize";

export interface StatisticPayload {
  userId: string,
}

export async function addUpdateReviewStatisticsJob(payload: StatisticPayload) {
  return addJob("updateReviewStatistics", payload);
}

function checkObjectFields(obj: object): boolean {
  for(let value of Object.values(obj)) {
    if(value){
      return true
    }
  }
  return false
}

function checkData(questCounter: number, userPhone: string, userKYC: StatusKYC): boolean {
  const minQuestsForVerifiedLevel = 10;
  return ((questCounter >= minQuestsForVerifiedLevel) && userPhone && (userKYC === StatusKYC.Confirmed));
}

function setRatingStatus(questCounter: number, userPhone: string, userKYC: StatusKYC, userAdditionalInfo: object): { isStatus: boolean, status?: string} {
  if(checkData(questCounter, userPhone, userKYC)) {
    for(let value of Object.values(userAdditionalInfo)) {
      if(!value || (Array.isArray(value) && !value.length) ||
        (typeof value === "object" && !Array.isArray(value) && !checkObjectFields(value))) {
        return { isStatus: false }
      }
    }
    const status = questCounter < 20 ? RatingStatus.verify :
      (questCounter < 30 ? RatingStatus.reliable : RatingStatus.topRanked);
    return { isStatus: true, status: status }
  }else {
    return { isStatus: false }
  }
}

export default async function(payload: StatisticPayload) {
  const [ratingStatistic] = await RatingStatistic.findOrCreate({
    include: [{
      model: User,
      as: 'user'
    }],
    where: {
      userId: payload.userId
    }
  });

  const reviewCountPromise = Review.count({ where: { toUserId: ratingStatistic.userId } });
  const averageMarkResultPromise = Review.findOne({
    attributes: [[fn('AVG', col('mark')), 'avgMark']],
    where: { toUserId: ratingStatistic.userId }
  });
  const [reviewCount, averageMarkResult] = await Promise.all([reviewCountPromise, averageMarkResultPromise]);

  let quests = 0;

  if (ratingStatistic.user.role === UserRole.Employer) {
    quests = await Quest.count({
      where: {
        userId: ratingStatistic.user.id,
      }
    });
  } else {
    quests = await Quest.count({
      where: {
        assignedWorkerId: ratingStatistic.user.id,
      }
    });
  }

  const countStatus = setRatingStatus(quests, ratingStatistic.user.phone, ratingStatistic.user.statusKYC, ratingStatistic.user.additionalInfo)

  await ratingStatistic.update({
    averageMark: averageMarkResult.getDataValue('avgMark'),
    reviewCount,
    status: countStatus.isStatus ? countStatus.status : null
  });
}
