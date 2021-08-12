import { addJob } from "../utils/scheduler";
import { Session, User } from "@workquest/database-models/lib/models";

export interface ids {
  userId: string,
  sessionId: string,
}

export default async function updateLastSession(payload: ids) {
  const user = await User.findByPk(payload.userId);
  const session = await Session.findByPk(payload.sessionId);
  await user.update({
    lastSession: {
      id: session.id,
      adminId: session.userId,
      place: session.place,
      device: session.device,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
  });
}

export async function updateLastSessionJob(payload: ids) {
  return addJob('updateLastSession', payload)
}
