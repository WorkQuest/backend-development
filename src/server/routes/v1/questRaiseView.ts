import * as Joi from "joi";
import * as handlers from '../../api/questRaiseView';
import {
  idSchema,
  outputOkSchema,
  questRaiseTypeScheme,
  questRaiseViewSchema,
  questRaiseDurationSchema,
} from "@workquest/database-models/lib/schemes";
import { activateRaiseView, payForRaiseView } from "../../api/questRaiseView";

export default [{
  method: "POST",
  path: "/v1/quest/{questId}/raise",
  handler: handlers.activateRaiseView,
  options: {
    auth: 'jwt-access',
    id: "v1.quest.raiseView.activate",
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
}, {
  method: "POST",
  path: "/v1/quest/{questId}/pay",
  handler: handlers.payForRaiseView,
  options: {
    auth: 'jwt-access',
    id: "v1.quest.raiseView.pay",
    tags: ["api", "quest-raiseView"],
    description: "Pay for quest raise view",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("QuestPayRaiseViewParams"),
      payload: Joi.object({
        duration: questRaiseDurationSchema.required(),
        type: questRaiseTypeScheme.required(),
      }).label("QuestPayRaiseViewPayload")
    },
    response: {
      schema: outputOkSchema(questRaiseViewSchema).label("QuestPayRaiseViewResponse"),
    },
  },
}];
