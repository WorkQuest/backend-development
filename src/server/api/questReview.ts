import { error, output } from '../utils';
import { addUpdateReviewStatisticsJob } from '../jobs/updateReviewStatistics';
import { QuestNotificationActions } from '../controllers/controller.broker';
import { ChecksListQuest } from '../checks-list/checksList.quest';
import { Errors } from '../utils/errors';
import { User, Quest, QuestsReview, UserRole, QuestStatus } from '@workquest/database-models/lib/models';
import { UserOldController } from '../controllers/user/controller.user';
import { QuestControllerFactory } from '../factories/factory.questController';

export async function sendReview(r) {
  const { questId } = r.payload;

  const fromUser: User = r.auth.credentials;
  const fromUserController = new UserOldController(fromUser);

  const questController = await QuestControllerFactory.createById(questId);

  const checksListQuest = new ChecksListQuest(questController.quest);

  checksListQuest
    .checkQuestStatuses(QuestStatus.Completed)
    .checkUserMustBelongToQuest(fromUser)

  const toUser: User = fromUser.role === UserRole.Worker ? questController.quest.user : questController.quest.assignedWorker;

  const alreadyReview = await QuestsReview.findOne({
    where: {
      toUserId: toUser.id,
      fromUserId: fromUser.id,
      questId: questController.quest.id,
    },
  });

  if (alreadyReview) {
    return error(Errors.AlreadyExists, 'You already valued this quest', {
      yourReviewId: alreadyReview.id,
    });
  }

  const review = await QuestsReview.create({
    toUserId: toUser.id,
    fromUserId: fromUser.id,
    questId: questController.quest.id,
    message: r.payload.message,
    mark: r.payload.mark,
  });

  review.setDataValue('fromUser', fromUserController.shortCredentials);

  await addUpdateReviewStatisticsJob({
    userId: toUser.id,
  });

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.userLeftReviewAboutQuest,
    recipients: [toUser.id],
    data: review,
  });

  return output(review);
}

export async function getReviewsOfUser(r) {
  const { count, rows } = await QuestsReview.findAndCountAll({
    include: [
      {
        model: User.scope('short'),
        as: 'fromUser',
      },
      {
        model: Quest, // TODO добавить short scope
        as: 'quest',
      },
    ],
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    where: { toUserId: r.params.userId },
    order: [['createdAt', 'DESC']],
  });

  return output({ count, reviews: rows });
}
