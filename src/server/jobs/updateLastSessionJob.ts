import { addJob } from "../utils/scheduler";
import { User } from "@workquest/database-models/lib/models";
import {Errors} from "../utils/errors";
import {error} from "../utils";

export interface id {
  userId: string
  sessionId: string,
}

export default async function updateLastSession(payload: id) {
  const user = await User.findByPk(payload.userId);
  if(!user) {
    throw error(Errors.NotFound, 'Account is not found', {})
  }
  await user.update({
    lastSessionId: payload.sessionId,
  });
}

export async function updateLastSessionJob(payload: id) {
  return addJob('updateLastSession', payload)
}
