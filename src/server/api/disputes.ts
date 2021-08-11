import { Quest, QuestStatus } from "@workquest/database-models/lib/models";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { Dispute, DisputeStatus } from "@workquest/database-models/lib/models/Disputes";
import { Op } from 'sequelize'

export async function createDispute(r) {
  const dispute = await Dispute.findOne({
    where: {
      questId: r.params.questId
    }
  })
  if(dispute) {
    return error(Errors.AlreadyExists,'Dispute for this quest already exists',{})
  }

  const quest = await Quest.findByPk(r.params.questId);
  //const transaction = await r.server.app.db.transaction();
  if(!quest) {
    return error(Errors.NotFound, 'Quest is not found', {});
  }

  if(quest.userId !== r.auth.credentials.id && quest.assignedWorkerId !== r.auth.credentials.id) {
    return error(Errors.InvalidRole, "Only employer or worker can open dispute", {});
  }
  const opponentUserId = quest.userId === r.auth.credentials.id ? quest.assignedWorkerId : quest.userId;
  //TODO может стоит здесь чекать статус
  //Если статус WaitConfirm, то менять статус на диспут в случае захода в эту функцию
  //Если статус Active и делается долго, то можно открыть диспут и поменять тут статус на диспут
  //Когда воркер может открыть диспут?
  quest.mustHaveStatus(QuestStatus.Dispute);

  const newDispute = await Dispute.create({
    openDisputeUserId: r.auth.credentials.id,
    opponentUserId: opponentUserId,
    questId: quest.id,
    status: DisputeStatus.pending,
    problem: r.payload.problem,
  });
  return output(await Dispute.findByPk(newDispute.id));
}


export async function getDisputeInfo(r) {
  const dispute = await Dispute.findByPk(r.params.disputeId)

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

export async function getDisputesInfo(r) {
  const disputes = await Dispute.findAndCountAll({
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


