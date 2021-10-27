import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { addUpdateReviewStatisticsJob } from '../jobs/updateReviewStatistics';
import { QuestController } from "../controllers/controller.quest";
import {
  User,
  Review,
  UserRole,
  QuestStatus,
} from "@workquest/database-models/lib/models";

export async function sendReview(r) {
  const fromUser: User = r.auth.credentials;
  const questController = new QuestController(r.payload.questId);
  const quest = await questController.findModel();

  await questController.questMustHaveStatus(QuestStatus.Done);

  if (fromUser.id !== quest.userId && fromUser.id !== quest.assignedWorkerId) {
    return error(Errors.Forbidden, "User does not belong to quest", {});
  }

  const toUser: User = fromUser.role === UserRole.Worker ? quest.user : quest.assignedWorker;

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
  const { count, rows } = await Review.findAndCountAll({
    include: [{
      model: User.scope('short'),
      as: 'fromUser'
    }],
    where: { toUserId: r.params.userId },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({count, reviews: rows});
}
