import { Quest } from "@workquest/database-models/lib/models";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { DisputeStatus, QuestDispute } from "@workquest/database-models/lib/models/";
import { Op } from "sequelize";

export async function createDispute(r) {
  const { id } = r.auth.credentials;

  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, 'Quest is not found', {});
  }

  const isDisputeExists = !!await QuestDispute.findOne({
    where: { questId: r.params.questId }
  });

  if (isDisputeExists) {
    return error(Errors.AlreadyExists,'Dispute for this quest already exists',{});
  }

  if (quest.userId !== id && quest.assignedWorkerId !== id) {
    return error(Errors.InvalidRole, "Only employer or worker can open dispute", {});
  }

  const date = new Date(quest.createdAt);
  const allowDate = date.getTime() + 86400000; // 1 day in ms

  if (allowDate > Date.now()) {
    return error(Errors.InvalidDate, 'Can open dispute after 24 hours after creating quest', {});
  }

  const opponentUserId = quest.userId === id ?
    quest.assignedWorkerId :
    quest.userId;

  const dispute = await QuestDispute.create({
    opponentUserId,
    openDisputeUserId: id,
    questId: quest.id,
    status: DisputeStatus.pending,
    reason: r.payload.reason,
    problem: r.payload.problem
  });

  return output(await QuestDispute.findByPk(dispute.id));
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

  if (dispute.quest.userId !== id && dispute.quest.assignedWorkerId !== id) {
    return error(Errors.InvalidRole, "Only employer or worker can take info about dispute", {});
  }

  return output(dispute);
}

export async function getDisputes(r) {
  const { rows, count } = await QuestDispute.findAndCountAll({
    where: {
      [Op.or]: [
        { openDisputeUserId: r.auth.credentials.id },
        { opponentUserId: r.auth.credentials.id }
      ]
    },
    order: [['createdAt', 'DESC']],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}


