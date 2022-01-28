import {addJob} from "../utils/scheduler";
import {UserRaiseStatus, UserRaiseView} from "@workquest/database-models/lib/models";

export type UserRaiseViewPayload = {
  questId: string,
  runAt: Date
}

export async function updateUserRaiseViewStatusJob(payload: UserRaiseViewPayload) {
  return addJob("updateUserRaiseViewStatus", payload, {'run_at': payload.runAt});
}

export default async function updateUserRaiseViewStatus(payload: UserRaiseViewPayload) {
  await UserRaiseView.update({ status: UserRaiseStatus.Closed }, { where: { questId: payload.questId } });
}
