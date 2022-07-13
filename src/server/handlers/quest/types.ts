import {
  Quest
} from "@workquest/database-models/lib/models";

/** Commands */
export interface GetQuestByIdCommand {
  readonly questId: string;
}

/** Results */
export type GetQuestByIdResult = Promise<Quest>
