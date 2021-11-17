import { DisputeReason, Quest, QuestStatus } from "@workquest/database-models/lib/models";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { DisputeStatus, QuestDispute } from "@workquest/database-models/lib/models/QuestDispute";
import { Op } from "sequelize";


//TODO test!!!
export async function createDispute(r) {
  const dispute = await QuestDispute.findOne({
    where: {
      questId: r.params.questId
    }
  });

  if(dispute) {
    return error(Errors.AlreadyExists,'Dispute for this quest already exists',{})
  }

  const quest = await Quest.findByPk(r.params.questId);
  if(!quest) {
    return error(Errors.NotFound, 'Quest is not found', {});
  }

  if(quest.userId !== r.auth.credentials.id && quest.assignedWorkerId !== r.auth.credentials.id) {
    return error(Errors.InvalidRole, "Only employer or worker can open dispute", {});
  }

  let dayInMilliseconds = 86400000
  const date = new Date(quest.createdAt)
  const allowDate = date.getTime() + dayInMilliseconds
  if(allowDate > Date.now()) {
    return error(Errors.InvalidDate, 'Can open dispute after 24 hours after creating quest', {});
  }

  const opponentUserId = quest.userId === r.auth.credentials.id ? quest.assignedWorkerId : quest.userId;

  if(r.payload.reason === DisputeReason.poorlyDoneJob) {
    quest.mustHaveStatus(QuestStatus.Reject);
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
  const dispute = await QuestDispute.findByPk(r.params.disputeId, {
    include: {
      model: Quest,
      as: 'quest'
    }
  });

  if(!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }

  if(dispute.quest.userId !== r.auth.credentials.id && dispute.quest.assignedWorkerId !== r.auth.credentials.id) {
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

  return output({ count: disputes.count, data: disputes.rows });
}


