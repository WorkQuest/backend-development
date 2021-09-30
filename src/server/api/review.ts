import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { addUpdateReviewStatisticsJob } from '../jobs/updateReviewStatistics';
import {
  QuestStatus,
  UserRole,
  Quest,
  Review,
} from "@workquest/database-models/lib/models";


export async function sendReview(r) {
   const fromUser = r.auth.credentials;
   const quest = await Quest.findByPk(r.payload.questId);

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  const alreadyReviewed = await Review.findOne({
    where: {
      questId: quest.id,
      fromUserId: fromUser.id,
    }
  });

  if(alreadyReviewed) {
    return error(Errors.AlreadyExists, 'You already valued this quest', {});
  }

  quest.mustHaveStatus(QuestStatus.Done);

  if (fromUser.id !== quest.userId && fromUser.id !== quest.assignedWorkerId) {
    return error(Errors.Forbidden, "User does not belong to quest", {});
  }

  const toUser = fromUser.role === UserRole.Worker ? quest.user : quest.assignedWorker;
  const review = await Review.create({
    toUserId: toUser.id,
    fromUserId: fromUser.id,
    questId: quest.id,
    message: r.payload.message,
    mark: r.payload.mark,
  });

  await addUpdateReviewStatisticsJob({
    userId: toUser.id,
  });


  return output(review);
}

export async function getReviewsOfUser(r) {
  const reviews = await Review.findAll({
    where: { toUserId: r.params.userId }
  });

  return output(reviews);
}
