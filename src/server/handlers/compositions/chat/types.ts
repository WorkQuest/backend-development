import { Chat, Message, User } from "@workquest/database-models/lib/models";

/** Commands */

export interface CreateGroupChatComposCommand {
  userIds: string[];
  chatName: string,
  chatCreator: User

}

/** Results */

export type CreateGroupChatComposResults = Promise<[
  Chat,
  Message,
]>


