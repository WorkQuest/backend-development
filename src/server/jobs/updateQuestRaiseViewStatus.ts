import { addJob } from "../utils/scheduler";
import { QuestRaiseStatus, QuestRaiseView } from "@workquest/database-models/lib/models";

export type QuestRaiseViewPayload = {
  id: string,
  status: QuestRaiseStatus,
}

export async function updateQuestRaiseViewStatusJob(payload: QuestRaiseViewPayload) {
  return addJob("updateQuestRaiseViewStatus", payload);
}

export default async function updateQuestRaiseViewStatus(payload: QuestRaiseViewPayload) {
  await QuestRaiseView.update({ status: payload.status }, { where: { id: payload.id } });
}

