import { addJob } from "../utils/scheduler";
import { Quest, QuestsStatistic, QuestStatus, UserRole } from "@workquest/database-models/lib/models";

export interface Data {
  userId: string,
  role: UserRole,
}

export async function updateQuestsStatisticJob(payload: Data) {
  return addJob("updateQuestsStatistic", payload);
}

export default async function updateQuestsStatistic(payload: Data) {
  let completedQuests, openedQuests;
  const questStatistic = await QuestsStatistic.findOne({ where: {userId: payload.userId} });
  if(payload.role === UserRole.Employer) {
    completedQuests = await Quest.count({
      where: {
        userId: payload.userId,
        status: QuestStatus.Done
      }
    });
    openedQuests = await Quest.count({
      where: {
        userId: payload.userId,
        status: QuestStatus.Active
      }
    });
  } else {
    completedQuests = await Quest.count({
      where: {
        assignedWorkerId: payload.userId,
        status: QuestStatus.Done
      }
    });
    openedQuests = await Quest.count({
      where: {
        assignedWorkerId: payload.userId,
        status: QuestStatus.Active
      }
    });
  }

  completedQuests = completedQuests + questStatistic.completed;
  openedQuests = openedQuests + questStatistic.opened;

  await QuestsStatistic.update({ completed: completedQuests, opened: openedQuests }, { where: {userId: payload.userId} });
}
4
