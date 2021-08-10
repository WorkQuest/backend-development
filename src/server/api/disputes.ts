import { Quest, QuestStatus } from "@workquest/database-models/lib/models";
import { error } from "../utils";
import { Errors } from "../utils/errors";
import { Disputes, DisputeStatus } from "@workquest/database-models/lib/models/Disputes";
import disputes from "../routes/v1/disputes";


export async function createDispute(r) {
  const quest = await Quest.findByPk(r.params.questId);
  //const transaction = await r.server.app.db.transaction();
  if(!quest) {
    return error(Errors.NotFound, 'Quest is not found', {})
  }

  if(quest.userId !== r.auth.credentials.id && quest.assignedWorkerId !== r.auth.credentials.id){
    return error(Errors.InvalidRole, "Only employer or worker can open dispute", {});
  }
  //TODO может стоит здесь чекать статус
  //Если статус WaitConfirm, то менять статус на диспут в случае захода в эту функцию
  //Если статус Active и делается долго, то можно открыть диспут и поменять тут статус на диспут
  //Когда воркер может открыть диспут?
  quest.mustHaveStatus(QuestStatus.Dispute)

  const newDispute = await Disputes.create({
    userId: quest.userId,
    assignedWorkerId: quest.assignedWorkerId,
    questId: quest.id,
    status: DisputeStatus.pending,
    problem: r.payload.problem,
  });
  return (newDispute);

}

