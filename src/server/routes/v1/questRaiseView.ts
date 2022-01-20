import * as Joi from "joi";
import * as handlers from '../../api/questRaiseView';
import {
  idSchema,
  outputOkSchema,
  questRaiseTypeScheme,
  questRaiseViewSchema,
  questRaiseDurationSchema,
} from "@workquest/database-models/lib/schemes";
import { activateRaiseView } from "../../api/questRaiseView";

export default [{
  method: "POST",
  path: "/v1/quest/{questId}/raise",
  handler: handlers.activateRaiseView,
  options: {
    auth: 'jwt-access',
    id: "v1.quest.raiseDispute.activate",
    tags: ["api", "quest-raiseView"],
    description: "Activate quest raise view",
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
