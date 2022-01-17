import { error, output } from "../utils";
import {addUpdateReviewStatisticsJob} from '../jobs/updateReviewStatistics';
import {publishQuestNotifications, QuestNotificationActions} from "../websocket/websocket.quest";
import {QuestController} from "../controllers/quest/controller.quest"
import { Errors } from "../utils/errors";
import {
  User,
  Quest,
  Review,
  UserRole,
  QuestStatus,
} from "@workquest/database-models/lib/models";

export async function sendReview(r) {
  const fromUser: User = r.auth.credentials;

  const questController = new QuestController(await Quest.findByPk(r.payload.questId));

  questController
    .questMustHaveStatus(QuestStatus.Done)
    .userMustBelongToQuest(fromUser.id)

  const toUser: User = fromUser.role === UserRole.Worker ? questController.quest.user : questController.quest.assignedWorker;

  const alreadyReview = await Review.findOne({
    where: {
      toUserId: toUser.id,
      fromUserId: fromUser.id,
      questId: questController.quest.id,
    }
  });

  if (alreadyReview) {
    return error(Errors.AlreadyExists, "You already valued this quest", {
      yourReviewId: alreadyReview.id,
    });
  }

  const review = await Review.create({
    toUserId: toUser.id,
    fromUserId: fromUser.id,
    questId: questController.quest.id,
    message: r.payload.message,
    mark: r.payload.mark,
  });

  await addUpdateReviewStatisticsJob({
    userId: toUser.id,
  });

  await publishQuestNotifications(r.server, {
    data: review,
    recipients: [toUser.id],
    action: QuestNotificationActions.userLeftReviewAboutQuest,
  });

  return output(review);
}

export async function getReviewsOfUser(r) {
  const { count, rows } = await Review.findAndCountAll({
    include: [{
      model: User.scope('short'),
      as: 'fromUser'
    }, {
      model: Quest, // TODO добавить short scope
      as: 'quest',
    }],
    distinct: true,
    where: { toUserId: r.params.userId },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({count, reviews: rows});
}
