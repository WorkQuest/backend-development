import { literal, Op } from "sequelize";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { QuestController } from "../controllers/quest/controller.quest";
import { QuestNotificationActions } from "../controllers/controller.broker";
import { UserOldController } from "../controllers/user/controller.user";
import {
  Admin,
  DisputeStatus,
  Quest,
  QuestChat,
  QuestDispute,
  QuestDisputeReview,
  QuestStatus,
  User
} from "@workquest/database-models/lib/models";
import { addUpdateDisputeReviewStatisticsJob } from "../jobs/updateDisputeReviewStatistics";
import { QuestControllerFactory } from '../factories/factory.questController';
import { ChecksListQuest } from '../checks-list/checksList.quest';

export async function getDispute(r) {
  const user: User = r.auth.credentials;
  const questChatWorkerLiteral = literal('"quest->questChat"."workerId" = "quest"."assignedWorkerId"');

  const dispute = await QuestDispute.findByPk(r.params.disputeId, {
    include: [
      {
        model: Quest,
        include: [
          {
            model: QuestChat.unscoped(),
            where: { questChatWorkerLiteral },
          },
        ],
      },
    ],
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
  const { count, rows } = await QuestDispute.findAndCountAll({
    where: {
      [Op.or]: [{ opponentUserId: r.auth.credentials.id }, { openDisputeUserId: r.auth.credentials.id }],
    },
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'DESC']],
  });

  return output({ count: count, disputes: rows });
}

export async function sendQuestDisputeReview(r) {
  return output();
  // const fromUser: User = r.auth.credentials;
  // const fromUserController = new UserOldController(fromUser);
  // const dispute = await QuestDispute.findByPk(r.params.disputeId);
  //
  // if (!dispute) {
  //   return error(Errors.NotFound, 'Dispute not found', { disputeId: r.params.disputeId });
  // }
  // if (dispute.status !== DisputeStatus.closed) {
  //   return error(Errors.InvalidStatus, 'Dispute status does not match', [{ current: dispute.status, mustHave: DisputeStatus.closed }]);
  // }
  //
  // fromUserController
  //   .userMustBeDisputeMember(dispute)
  //
  // const toAdmin: Admin = await Admin.findByPk(dispute.assignedAdminId);
  //
  // const alreadyReview = await QuestDisputeReview.findOne({
  //   where: {
  //     toAdminId: toAdmin.id,
  //     fromUserId: fromUser.id,
  //     disputeId: dispute.id,
  //   },
  // });
  //
  // if (alreadyReview) {
  //   return error(Errors.AlreadyExists, 'You already valued this dispute', {
  //     yourReviewId: alreadyReview.id,
  //   });
  // }
  //
  // const review = await QuestDisputeReview.create({
  //   toAdminId: toAdmin.id,
  //   fromUserId: fromUser.id,
  //   disputeId: dispute.id,
  //   message: r.payload.message,
  //   mark: r.payload.mark,
  // });
  //
  // review.setDataValue('fromUser', fromUserController.shortCredentials);
  //
  // //TODO: add job for admin review
  // await addUpdateDisputeReviewStatisticsJob({
  //   adminId: toAdmin.id,
  // });
  //
  // return output(review);
}
