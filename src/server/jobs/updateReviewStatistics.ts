import { addJob } from "../utils/scheduler";
import { RatingStatistic, Review, User, UserRole, Quest } from "@workquest/database-models/lib/models";
import { col, fn } from "sequelize"
import { array } from "joi";
export interface StatisticPayload {
  userId: string,
}

export async function addUpdateReviewStatisticsJob(payload: StatisticPayload) {
  return addJob("updateReviewStatistics", payload);
}

function checkObjectFields(obj: object): boolean {
  for(let value of Object.values(obj)){
    if(value){
      return true
    }
  }
  return false
}

async function setRatingStatus(questCounter: number, userId: string): Promise<{ isStatus: boolean, status?: string }>  {
  const minQuestsForVerifiedLevel = 10;
  if(questCounter >= minQuestsForVerifiedLevel) {
    const user = await User.findByPk(userId);
    for(let value of Object.values(user.additionalInfo)) {
      if(!value || (Array.isArray(value) && !value.length) || (typeof value === "object" && !Array.isArray(value) && !checkObjectFields(value))) { //null and empty arrays
        return {isStatus: false}
      }
    }
  }else {
    return {isStatus: false}
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

  const a = await setRatingStatus(30, payload.userId)

  await ratingStatistic.update({
    averageMark: averageMarkResult.getDataValue('avgMark'),
    reviewCount,
  });
}
