import * as Joi from "joi";
import { createQuest, deleteQuest, editQuest, getQuests } from '../../api/quest';
import { emptyOkSchema, outputOkSchema, locationSchema, idSchema } from '../../schemes';
import {
  adTypeSchema,
  categorySchema,
  descriptionSchema,
  priceSchema,
  questPrioritySchema, questSchema,
  titleSchema, questsQuerySchema
} from '../../schemes/quest';

const questId = idSchema.label('QuestId');
const mediaIdSchema = idSchema.label('MediaId');
const mediasSchema = Joi.array().items(mediaIdSchema).unique().label('Medias');
const questsOutputSchema = Joi.object({
  count: Joi.number().integer().example(10).label('CountQuests'),
  quests: Joi.array().items(questSchema).label('QuestsList'),
}).label("QuestsOutput");

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
        priority: questPrioritySchema.required(),
        location: locationSchema.required(),
        title: titleSchema.required(),
        description: descriptionSchema.required(),
        price: priceSchema.required(),
        medias: mediasSchema.default([]),
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
        questId: questId.required(),
      }).label("DeleteQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  },
}, {
  method: "PUT",
  path: "/v1/quest/{questId}",
  handler: editQuest,
  options: {
    id: "v1.quest.editQuest",
    tags: ["api", "quest"],
    description: "Edit quest",
    validate: {
      params: Joi.object({
        questId: questId.required(),
      }).label("EditQuestParams"),
      payload: Joi.object({
        category: categorySchema,
        priority: questPrioritySchema,
        location: locationSchema,
        title: titleSchema,
        description: descriptionSchema,
        price: priceSchema,
        adType: adTypeSchema,
        medias: mediasSchema,
      }).label("EditQuestPayload"),
    },
    response: {
      schema: outputOkSchema(questSchema).label("QuestResponse"),
    },
  }
}, {
  method: "GET",
  path: "/v1/quests",
  handler: getQuests,
  options: {
    id: "v1.quests",
    tags: ["api", "quest"],
    description: "Get quests",
    validate: {
      query: questsQuerySchema
    },
    response: {
      schema: outputOkSchema(questsOutputSchema).label("QuestsResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/employer/{userId}/quests",
  handler: getQuests,
  options: {
    id: "v1.employer.quests",
    tags: ["api", "quest"],
    description: "Get quests for a given user",
    validate: {
      params: Joi.object({
        userId: idSchema.required().label('UserId'),
      }).label("GetQuestsParams"),
      query: questsQuerySchema
    },
    response: {
      schema: outputOkSchema(questsOutputSchema).label("QuestsResponse")
    },
  }
}];
