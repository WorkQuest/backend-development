import { addJob } from "../utils/scheduler";
import { User } from "@workquest/database-models/lib/models";

export interface id{
  id: string
}

export default async function updateLogoutAt(payload: id) {
  const user = await User.findByPk(payload.id);
  await user.update({
    logoutAt: Date.now(),
  });
}

export async function updateLogoutAtJob(payload: id) {
  return addJob('updateLogoutAt', payload)
}
