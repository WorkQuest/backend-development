import { Op, literal } from 'sequelize';
import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { QuestController } from '../controllers/quest/controller.quest';
import { QuestNotificationActions } from '../controllers/controller.broker';
import { UserController } from "../controllers/user/controller.user";
import {
  User,
  Quest,
  QuestChat,
  QuestStatus,
  QuestDispute,
  DisputeStatus,
} from '@workquest/database-models/lib/models';

export async function openDispute(r) {
  const user: User = r.auth.credentials;
  const userController = new UserController(user);

  const isDisputeExists = await QuestDispute.findOne({
    where: { questId: r.params.questId },
  });

  if (isDisputeExists) {
    return error(Errors.AlreadyExists, 'Dispute for this quest already exists', {});
  }

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  questController.userMustBelongToQuest(user.id).questMustHaveStatus(QuestStatus.Active, QuestStatus.WaitConfirm);

  // if (r.payload.reason === DisputeReason.poorlyDoneJob) {
  //   questController.questMustHaveStatus(QuestStatus.WaitConfirm);
  // }

  const dayInMilliseconds = 60000; // 86400000; TODO после тестов перевести в 86400000
  const allowDate = quest.startedAt.getTime() + dayInMilliseconds;

  if (allowDate > Date.now()) {
    return error(Errors.InvalidDate, 'Can open dispute after 24 hours after creating quest', {});
  }

  const opponentUserId = quest.userId === user.id ? quest.assignedWorkerId : quest.userId;

  const transaction = await r.server.app.db.transaction();

  const dispute = await QuestDispute.create(
    {
      opponentUserId,
      questId: quest.id,
      openDisputeUserId: user.id,
      status: DisputeStatus.pending,
      openOnQuestStatus: quest.status,
      reason: r.payload.reason,
      problemDescription: r.payload.problemDescription,
    },
    { transaction },
  );

  await questController.openDispute(transaction);

  await transaction.commit();

  dispute.setDataValue('quest', quest);
  dispute.setDataValue('openDisputeUser', userController.shortCredentials);
  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.openDispute,
    recipients: [opponentUserId],
    data: dispute,
  });

  return output(dispute);
}

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

  const questController = new QuestController(dispute.quest);

  questController.userMustBelongToQuest(user.id);

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
