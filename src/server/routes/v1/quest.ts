import * as Joi from "joi";
import { createQuest, deleteQuest } from '../../api/quest';
import { emptyOkSchema, outputOkSchema } from '../../schemes';
import {
  adTypeSchema,
  categorySchema,
  descriptionSchema,
  locationSchema, priceSchema,
  prioritySchema, questIdSchema, questSchema,
  titleSchema
} from '../../schemes/quest';

export default [{
  method: "POST",
  path: "/v1/quest/create",
  handler: createQuest,
  options: {
    id: "v1.quest.create",
    tags: ["api", "quest"],
    description: "Register new quest",
    validate: {
      payload: Joi.object({
        category: categorySchema.required(),
        priority: prioritySchema.required(),
        location: locationSchema.required(),
        title: titleSchema.required(),
        description: descriptionSchema.required(),
        price: priceSchema.required(),
        adType: adTypeSchema,
      }).label("CreateQuestPayload")
    },
    response: {
      schema: outputOkSchema(questSchema).label("QuestResponse"),
    },
  },
}, {
  method: "DELETE",
  path: "/v1/quest/{questId}",
  handler: deleteQuest,
  options: {
    id: "v1.quest.deleteQuest",
    tags: ["api", "quest"],
    description: "Delete quest",
    validate: {
      params: Joi.object({
        questId: questIdSchema,
      }).label("DeleteQuestParams")
    },
    response: {
      schema: emptyOkSchema.label("DeleteQuestResponse"),
    },
  },
}];
