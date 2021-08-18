import { DisputeReason, Quest, QuestStatus } from "@workquest/database-models/lib/models";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { DisputeStatus, QuestDispute } from "@workquest/database-models/lib/models/QuestDispute";
import { Op } from "sequelize";

export async function createDispute(r) {
  const quest = await Quest.findByPk(r.params.questId);
  if(!quest) {
    return error(Errors.NotFound, 'Quest is not found', {});
  }

  const dispute = await QuestDispute.findOne({
    where: {
      questId: r.params.questId
    }
  })

  if(dispute) {
    return error(Errors.AlreadyExists,'Dispute for this quest already exists',{})
  }

  if(quest.userId !== r.auth.credentials.id && quest.assignedWorkerId !== r.auth.credentials.id) {
    return error(Errors.InvalidRole, "Only employer or worker can open dispute", {});
  }
  const opponentUserId = quest.userId === r.auth.credentials.id ? quest.assignedWorkerId : quest.userId;

  if(r.payload.reason === DisputeReason.poorlyDoneJob){
    quest.mustHaveStatus(QuestStatus.Reject)
  }

  const newDispute = await QuestDispute.create({
    openDisputeUserId: r.auth.credentials.id,
    opponentUserId: opponentUserId,
    questId: quest.id,
    status: DisputeStatus.pending,
    reason: r.payload.reason,
    problem: r.payload.problem,
  });
  return output(await QuestDispute.findByPk(newDispute.id));
}


export async function getDisputeInfo(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId)

  if(!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }

  const quest = await Quest.findOne({
    where: {
      id: dispute.questId,
    }
  })

  if(!quest) {
    return error(Errors.NotFound, 'Quest is not found', {});
  }

  if(quest.userId !== r.auth.credentials.id && quest.assignedWorkerId !== r.auth.credentials.id) {
    return error(Errors.InvalidRole, "Only employer or worker can take info about dispute", {});
  }

  return output(dispute);
}

export async function getDisputes(r) {
  const disputes = await QuestDispute.findAndCountAll({
    where: {
      [Op.or]: [ {openDisputeUserId: r.auth.credentials.id}, {opponentUserId: r.auth.credentials.id}]
    },
    limit: r.query.limit,
    offset: r.query.offset,
  })

  if(!disputes) {
    return error(Errors.NotFound, "Disputes are not found", {});
  }

  return output({ count: disputes.count, data: disputes.rows });
}


