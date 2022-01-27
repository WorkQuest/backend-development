import {addJob} from "../utils/scheduler";
import {QuestRaiseStatus, QuestRaiseView} from "@workquest/database-models/lib/models";

export type QuestRaiseViewPayload = {
  questId: string,
  runAt: Date
}

export async function updateQuestRaiseViewStatusJob(payload: QuestRaiseViewPayload) {
  return addJob("updateQuestRaiseViewStatus", payload, {'run_at': payload.runAt});
}

export default async function updateQuestRaiseViewStatus(payload: QuestRaiseViewPayload) {
  await QuestRaiseView.update({ status: QuestRaiseStatus.Closed }, { where: { questId: payload.questId } });
}

