import * as Joi from "joi";
import * as handlers from '../../api/quest';
import {
  outputOkSchema,
  idSchema,
  idsSchema,
  emptyOkSchema,
  locationSchema,
  workPlaceSchema,
  questAdTypeSchema,
  questCategorySchema,
  questDescriptionSchema,
  questPriceSchema,
  prioritySchema,
  questSchema,
  questTitleSchema,
  questQuerySchema,
  questsForGetWithCountSchema,
  questLocationPlaceNameSchema,
  questEmploymentSchema,
  specializationKeysSchema,
  chatForGetSchema, questRaiseViewSchema
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "POST",
  path: "/v1/quest/{questId}/create-raiseView",
  handler: handlers.createQuest,
  options: {
    auth: 'jwt-access',
    id: "v1.quest.raiseDispute.create",
    tags: ["api", "quest-raiseView"],
    description: "Create quest raise view",
    validate: {
      params: {
        questId: idSchema.required(),
      },
      payload: Joi.object({

      }).label("QuestRaiseViewPayload")
    },
    response: {
      schema: outputOkSchema(questRaiseViewSchema).label("QuestRaiseViewResponse"),
    },
  },
}];
