import * as Joi from "joi";
import * as handlers from '../../api/questRaiseView';
import {
  outputOkSchema,
  idSchema,
  questRaiseViewSchema, questRaiseDurationSchema, questRaiseTypeScheme
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "POST",
  path: "/v1/quest/{questId}/create-raiseView",
  handler: handlers.createRaiseView,
  options: {
    auth: 'jwt-access',
    id: "v1.quest.raiseDispute.create",
    tags: ["api", "quest-raiseView"],
    description: "Create quest raise view",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("QuestRaiseViewParams"),
      payload: Joi.object({
        duration: questRaiseDurationSchema.required(),
        type: questRaiseTypeScheme.required(),
      }).label("QuestRaiseViewPayload")
    },
    response: {
      schema: outputOkSchema(questRaiseViewSchema).label("QuestRaiseViewResponse"),
    },
  },
}];
