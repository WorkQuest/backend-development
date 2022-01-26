import * as Joi from "joi";
import * as handlers from '../../api/userRaiseView';
import {
  idSchema,
  outputOkSchema,
  userRaiseTypeScheme,
  userRaiseViewSchema,
  userRaiseDurationSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "POST",
  path: "/v1/user/{userId}/raise",
  handler: handlers.activateRaiseView,
  options: {
    auth: 'jwt-access',
    id: "v1.quest.raiseDispute.activate",
    tags: ["api", "user-raiseView"],
    description: "Activate user raise view",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("UserRaiseViewParams"),
      payload: Joi.object({
        duration: userRaiseDurationSchema.required(),
        type: userRaiseTypeScheme.required(),
      }).label("UserRaiseViewPayload")
    },
    response: {
      schema: outputOkSchema(userRaiseViewSchema).label("UserRaiseViewResponse"),
    },
  },
}];
