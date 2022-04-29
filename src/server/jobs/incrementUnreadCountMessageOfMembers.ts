import { addJob } from '../utils/scheduler';
import Database from "../providers/provider.postgres";
import { incrementUnreadCountMessage } from "../queries";

export type UnreadMessageIncrementPayload = {
  chatId: string;
  skipMemberIds: string[]
};

export async function incrementUnreadCountMessageOfMembersJob(payload: UnreadMessageIncrementPayload) {
  return addJob('incrementUnreadCountMessageOfMembers', payload);
}

export default async function incrementUnreadCountMessageOfMembers(payload: UnreadMessageIncrementPayload) {
  const db = Database.instance();
  const options = {
    replacements: {
      chatId: payload.chatId,
      skipMembersIds: payload.skipMemberIds,
    },
  };
  await db.query(incrementUnreadCountMessage, options);
}



