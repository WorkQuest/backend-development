import { addJob } from "../utils/scheduler";
import { Quest, QuestsStatistic, QuestStatus } from "@workquest/database-models/lib/models";

export interface id {
  id: string,
}

export async function updateQuestsStatisticJob(payload: id) {
  return addJob("updateQuestsStatistic", payload);
}

export default async function updateQuestsStatistic(payload: id) {
  const questsStatistic = await QuestsStatistic.findOne({
    where: {
      userId: payload.id
    }
  });
  const completedQuests = await Quest.count({
    where: {
      userId: payload.id,
      status: QuestStatus.Done
    }
  })
  const openedQuests = await Quest.count({
    where: {
      userId: payload.id,
      status: QuestStatus.Active
    }
  })

  await questsStatistic.update({
    completed: completedQuests,
    opened: openedQuests,
  })
}
