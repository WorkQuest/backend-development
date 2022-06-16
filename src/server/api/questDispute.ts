import { literal, Op } from "sequelize";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { ChecksListQuest } from '../checks-list/checksList.quest';
import { UserOldController } from "../controllers/user/controller.user";
import { QuestControllerFactory } from '../factories/factory.questController';
import { addUpdateDisputeReviewStatisticsJob } from "../jobs/updateDisputeReviewStatistics";
import { QuestStatisticController } from '../controllers/statistic/controller.questStatistic';
import {
  User,
  Admin,
  Quest,
  QuestChat,
  QuestStatus,
  QuestDispute,
  DisputeStatus,
  QuestDisputeReview, DisputesPlatformStatisticFields
} from '@workquest/database-models/lib/models';

export async function createDispute(r) {
  const user: User = r.auth.credentials;

  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, 'Quest not found', {});
  }

  const checksListQuest = new ChecksListQuest(quest);

  checksListQuest.checkUserMustBelongToQuest(user);

  const alreadyExists = !!await QuestDispute.findOne({
    where: {
      questId: quest.id,
      status: { [Op.ne]: DisputeStatus.Closed }
    }
  });

  if (alreadyExists) {
    return error(Errors.AlreadyExists, 'Dispute for this quest already created', {});
  }

  checksListQuest.checkQuestStatuses(
    QuestStatus.ExecutionOfWork,
    QuestStatus.WaitingForEmployerConfirmationWork
  );

  const dispute = await QuestDispute.create({
    questId: quest.id,
    openDisputeUserId: user.id,
    opponentUserId: quest.userId === user.id ?
      quest.assignedWorkerId : quest.userId,
    openOnQuestStatus: quest.status,
    status: DisputeStatus.Pending,
    reason: r.payload.reason,
    problemDescription: r.payload.problemDescription,
  });

  await QuestStatisticController.createDisputeAction();

  return output(await QuestDispute.findByPk(dispute.id));
}

export async function getDispute(r) {
  const user: User = r.auth.credentials;
  const questChatWorkerLiteral = literal('"quest->questChat"."workerId" = "quest"."assignedWorkerId"');

  const include = [{
    model: QuestDisputeReview,
    as: 'currentUserDisputeReview',
    where: {
      fromUserId: user.id,
    },
    required: false,
  }, {
    model: Quest,
    include: [{
      model: QuestChat.unscoped(),
      where: { questChatWorkerLiteral },
    },],
  }];

  const dispute = await QuestDispute.findByPk(r.params.disputeId, {
    include,
  });

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }

  const questController = QuestControllerFactory.createByModel(dispute.quest);
  const checksListQuest =  new ChecksListQuest(questController.quest);

  checksListQuest
    .checkUserMustBelongToQuest(user);

  return output(dispute);
}

export async function getDisputes(r) {
  const include = [{
    model: QuestDisputeReview,
    as: 'currentUserDisputeReview',
    where: {
      fromUserId: r.auth.credentials.id,
    },
    required: false,
  }];

  const { count, rows } = await QuestDispute.findAndCountAll({
    where: {
      [Op.or]: [
        { opponentUserId: r.auth.credentials.id },
        { openDisputeUserId: r.auth.credentials.id }
      ],
    },
    include,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'DESC']],
  });

  return output({ count, disputes: rows });
}

export async function sendQuestDisputeReview(r) {
  const fromUser: User = r.auth.credentials;
  const fromUserController = new UserOldController(fromUser);
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute not found', { disputeId: r.params.disputeId });
  }
  if (dispute.status !== DisputeStatus.Closed) {
    return error(Errors.InvalidStatus, 'Dispute status does not match', [{ current: dispute.status, mustHave: DisputeStatus.Closed }]);
  }

  fromUserController
    .userMustBeDisputeMember(dispute)

  const toAdmin = await Admin.findByPk(dispute.assignedAdminId);

  if (!toAdmin) {
    return error(Errors.NotFound, 'Admin not found', {});
  }

  const alreadyReview = await QuestDisputeReview.findOne({
    where: {
      toAdminId: toAdmin.id,
      fromUserId: fromUser.id,
      disputeId: dispute.id,
    },
  });

  if (alreadyReview) {
    return error(Errors.AlreadyExists, 'You already valued this dispute', {
      yourReviewId: alreadyReview.id,
    });
  }

  const review = await QuestDisputeReview.create({
    toAdminId: toAdmin.id,
    fromUserId: fromUser.id,
    disputeId: dispute.id,
    message: r.payload.message,
    mark: r.payload.mark,
  });

  await addUpdateDisputeReviewStatisticsJob({
    adminId: toAdmin.id,
  });

  return output(await QuestDisputeReview.findByPk(review.id));
}
