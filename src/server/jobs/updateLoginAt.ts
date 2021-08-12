import { addJob } from "../utils/scheduler";
import { User } from "@workquest/database-models/lib/models";

export interface id{
  id: string
}

export default async function updateLoginAt(payload: id) {
  const user = await User.findByPk(payload.id);
  await user.update({
    loginAt: Date.now(),
  });
}

export async function updateLoginAtJob(payload: id) {
  return addJob('updateLoginAt', payload)
}
