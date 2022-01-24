import {addJob} from "../utils/scheduler";
import {Quest, QuestRaiseStatus, QuestRaiseType, QuestRaiseView} from "@workquest/database-models/lib/models";

export type QuestRaiseViewPayload = {
  questId: string,
  status: QuestRaiseStatus,
  type: QuestRaiseType
}

export async function updateQuestRaiseViewStatusJob(payload: QuestRaiseViewPayload) {
  return addJob("updateQuestRaiseViewStatus", payload);
}

export default async function updateQuestRaiseViewStatus(payload: QuestRaiseViewPayload) {
  await QuestRaiseView.update({ status: payload.status }, { where: { questId: payload.questId } });
  await Quest.update({adType: QuestRaiseType}, {where: {id: payload.questId}});
}

