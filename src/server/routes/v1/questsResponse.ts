import * as Joi from "joi";
import { questResponse } from '../../api/questsResponse'
import { questIdSchema } from '../../schemes/quest';
import { emptyOkSchema } from '../../schemes';
import { messageSchema } from '../../schemes/questsResponse';

export default [{
  method: "POST",
  path: "/v1/quest/{questId}/response",
  handler: questResponse,
  options: {
    id: "v1.quest.response",
    tags: ["api", "quest", "response"],
    description: "Respond on quest",
    validate: {
      params: Joi.object({
        questId: questIdSchema.required(),
      }).label("QuestResponseParams"),
      payload: Joi.object({
        message: messageSchema,
      }).label('QuestResponsePayload'),
    },
    response: {
      schema: emptyOkSchema.label("ResponseQuestResponse"),
    },
  },
}];
