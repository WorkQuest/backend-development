import * as Joi from "joi";
import { createQuest, deleteQuest, editQuest, getQuests } from '../../api/quest';
import { emptyOkSchema, outputOkSchema, sortDirectionSchema } from '../../schemes';
import {
  adTypeSchema,
  categorySchema,
  descriptionSchema,
  locationSchema, priceSchema,
  questPrioritySchema, questIdSchema, questSchema,
  titleSchema, questStatusSchema
} from '../../schemes/quest';

const questsQueryScheme = Joi.object({
  offset: Joi.number().min(0).default(0).label('offset'),
  limit: Joi.number().min(0).default(10).max(100).label('limit'),
  q: Joi.string().default(null).max(255),
  priority: questPrioritySchema.default(null),
  status: questStatusSchema.default(null),
  sort: Joi.object({
    price: sortDirectionSchema,
    createdAt: sortDirectionSchema,
  }).default({}).label('QuestsListSortSchema'),
}).label('QuestsQueryScheme');

const questsOutputScheme = Joi.object({
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
        questId: questIdSchema.required(),
      }).label("DeleteQuestParams")
    },
    response: {
      schema: emptyOkSchema.label("DeleteQuestResponse"),
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
        questId: questIdSchema.required(),
      }).label("EditQuestParams"),
      payload: Joi.object({
        category: categorySchema,
        priority: questPrioritySchema,
        location: locationSchema,
        title: titleSchema,
        description: descriptionSchema,
        price: priceSchema,
        adType: adTypeSchema,
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
      query: questsQueryScheme
    },
    response: {
      schema: outputOkSchema(questsOutputScheme).label("QuestsResponse")
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
      query: questsQueryScheme
    },
    response: {
      schema: outputOkSchema(questsOutputScheme).label("QuestsResponse")
    },
  }
}];
