import { addJob } from "../utils/scheduler";
import { QuestsStatistic, QuestStatus } from "@workquest/database-models/lib/models";

export interface id {
  id: string,
  status: QuestStatus,
}

export async function changeQuestsStatisticJob(payload: id) {
  return addJob("changeQuestsStatistic", payload);
}

export default async function changeQuestsStatistic(payload: id) {
  const questsStatistic = await QuestsStatistic.findOne({
    where: {
      userId: payload.id
    }
  });
  const status = payload.status === QuestStatus.Active ? QuestStatus.Active : QuestStatus.Done

  if(status === QuestStatus.Active){
    await questsStatistic.update({
      openedQuests: questsStatistic.openedQuests + 1,
    })
  }else{
    await questsStatistic.update({
      completedQuests: questsStatistic.completedQuests + 1,
    })
  }



}

