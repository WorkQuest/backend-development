import {
  User,
  Quest,
  QuestsResponse,
} from '@workquest/database-models/lib/models';

export interface CreateQuestChatPayload {
  readonly worker: User;
  readonly quest: Quest;
  readonly questResponse: QuestsResponse;

  readonly message: string;
}

export interface CreateGroupChatPayload {
  readonly users: User[];

  readonly name: string;
}
