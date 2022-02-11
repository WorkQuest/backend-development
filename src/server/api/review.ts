import { error, output } from '../utils';
import { addUpdateReviewStatisticsJob } from '../jobs/updateReviewStatistics';
import { QuestNotificationActions } from '../controllers/controller.broker';
import { QuestController } from '../controllers/quest/controller.quest';
import { Errors } from '../utils/errors';
import { User, Quest, Review, UserRole, QuestStatus, Admin } from '@workquest/database-models/lib/models';
import { UserController } from '../controllers/user/controller.user';
import { ReviewAdmin } from '@workquest/database-models/lib/models/quest/ReviewAdmin';

export async function sendReview(r) {
  const fromUser: User = r.auth.credentials;
  const fromUserController = new UserController(fromUser);

  const questController = new QuestController(await Quest.findByPk(r.payload.questId));

  questController.questMustHaveStatus(QuestStatus.Done).userMustBelongToQuest(fromUser.id);

  const toUser: User = fromUser.role === UserRole.Worker ? questController.quest.user : questController.quest.assignedWorker;

  const alreadyReview = await Review.findOne({
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

  const review = await Review.create({
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
  const { count, rows } = await Review.findAndCountAll({
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

export async function sendReviewAdmin(r) {
  const { idAdmin } = r.params;
  const { questId, message, mark } = r.payload ;
  const fromUser: User = r.auth.credentials;

  const admin = await Admin.findByPk(idAdmin)

  if(!admin) {
    return error(Errors.AlreadyExists, 'Admin not found', { idAdmin });
  }

  const available = await ReviewAdmin.findOne({
    where: {
      fromUserId: fromUser.id,
      toAdminId: idAdmin,
      questId: questId,
    },
  });

  if (available) {
    return error(Errors.AlreadyExists, 'You already valued this quest', {
      yourReviewId: available.id,
    });
  }


  const reviewAdmin = await ReviewAdmin.create({
    fromUserId: fromUser.id,
    toAdminId: idAdmin,
    questId: questId,
    message: message,
    mark: mark,
  });

  return output(reviewAdmin)
}

