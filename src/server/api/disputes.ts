import { Op } from "sequelize";
import {error, output} from "../utils";
import {Errors} from "../utils/errors";
import { QuestController } from "../controllers/quest/controller.quest";
import {
  User,
  Quest,
  QuestStatus,
  QuestDispute,
  DisputeStatus,
  DisputeReason,
} from "@workquest/database-models/lib/models";


export async function createDispute(r) {
  const user: User = r.auth.credentials;

  const isDisputeExists = await QuestDispute.findOne({
    where: { questId: r.params.questId }
  });

  if (isDisputeExists) {
    return error(Errors.AlreadyExists,'Dispute for this quest already exists',{})
  }

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  if (quest.userId !== r.auth.credentials.id && quest.assignedWorkerId !== r.auth.credentials.id) {
    return error(Errors.InvalidRole, "Only employer or worker can open dispute", {});
  }

  const dayInMilliseconds = 86400000
  const allowDate = quest.createdAt.getTime() + dayInMilliseconds;

  if (allowDate > Date.now()) {
    return error(Errors.InvalidDate, 'Can open dispute after 24 hours after creating quest', {});
  }

  const opponentUserId = quest.userId === user.id ?
    quest.assignedWorkerId :
    quest.userId;

  if (r.payload.reason === DisputeReason.poorlyDoneJob) {
    questController.questMustHaveStatus(QuestStatus.WaitConfirm);
  }

  const dispute = await QuestDispute.create({
    opponentUserId,
    openDisputeUserId: user.id,
    questId: quest.id,
    status: DisputeStatus.pending,
    reason: r.payload.reason,
    problem: r.payload.problem
  });

  return output(dispute);
}

export async function getDisputeInfo(r) {
  const { id } = r.auth.credentials;

  const dispute = await QuestDispute.findByPk(r.params.disputeId, {
    include: {
      model: Quest,
      as: 'quest'
    }
  });

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }

  if (dispute.quest.userId !== r.auth.credentials.id && dispute.quest.assignedWorkerId !== r.auth.credentials.id) {
    return error(Errors.InvalidRole, "Only employer or worker can take info about dispute", {});
  }

  return output(dispute);
}

export async function getDisputes(r) {
  const { count, rows } = await QuestDispute.findAndCountAll({
    where: {
      [Op.or]: [
        { opponentUserId: r.auth.credentials.id },
        { openDisputeUserId: r.auth.credentials.id },
      ]
    },
    order: [['createdAt', 'DESC']],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count: count, disputes: rows });
}


