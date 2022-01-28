import {addJob} from "../utils/scheduler";
import {UserRaiseStatus, UserRaiseView} from "@workquest/database-models/lib/models";

export type UserRaiseViewPayload = {
  questId: string,
  runAt: Date
}

export async function updateQuestRaiseViewStatusJob(payload: UserRaiseViewPayload) {
  return addJob("updateQuestRaiseViewStatus", payload, {'run_at': payload.runAt});
}

export default async function updateQuestRaiseViewStatus(payload: UserRaiseViewPayload) {
  await UserRaiseView.update({ status: UserRaiseStatus.Closed }, { where: { questId: payload.questId } });
}
