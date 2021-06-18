import * as Joi from "joi";
import {
  acceptCompletedWorkOnQuest,
  acceptWorkOnQuest,
  closeQuest, completeWorkOnQuest,
  createQuest,
  deleteQuest,
  editQuest,
  getQuests, rejectCompletedWorkOnQuest,
  rejectWorkOnQuest,
  startQuest
} from '../../api/quest';
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
const mediasSchema = Joi.array().items(mediaIdSchema).label('Medias');
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
        medias: mediasSchema.required().unique().label('Medias'),
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
    description: "Delete quest (only status: Created and Closed)",
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
        medias: mediasSchema.unique().label('Medias'), // TODO: Why Model1???
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
}, {
  method: "POST",
  path: "/v1/quest/{questId}/start",
  handler: startQuest,
  options: {
    id: "v1.quest.startQuest",
    tags: ["api", "quest"],
    description: "Start quest",
    validate: {
      payload: Joi.object({
        assignedWorkerId: idSchema.required().label('AssignedWorkerId')
      }).label('StartQuestPayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/close",
  handler: closeQuest,
  options: {
    id: "v1.quest.closeQuest",
    tags: ["api", "quest"],
    description: "Close quest",
    validate: {
      params: Joi.object({
        questId: questId.required(),
      }).label("DeleteQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/reject-work",
  handler: rejectWorkOnQuest,
  options: {
    id: "v1.quest.rejectWork",
    tags: ["api", "quest"],
    description: "Reject work on quest",
    validate: {
      params: Joi.object({
        questId: questId.required(),
      }).label("RejectWorkOnQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/accept-work",
  handler: acceptWorkOnQuest,
  options: {
    id: "v1.quest.acceptWork",
    tags: ["api", "quest"],
    description: "Accept work on quest",
    validate: {
      params: Joi.object({
        questId: questId.required(),
      }).label("AcceptWorkOnQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/complete-work",
  handler: completeWorkOnQuest,
  options: {
    id: "v1.quest.completeWork",
    tags: ["api", "quest"],
    description: "Complete work on quest",
    validate: {
      params: Joi.object({
        questId: questId.required(),
      }).label("CompleteWorkOnQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/accept-completed-work",
  handler: acceptCompletedWorkOnQuest,
  options: {
    id: "v1.quest.acceptCompletedWork",
    tags: ["api", "quest"],
    description: "Accept completed work on quest",
    validate: {
      params: Joi.object({
        questId: questId.required(),
      }).label("AcceptCompletedWorkParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/reject-completed-work",
  handler: rejectCompletedWorkOnQuest,
  options: {
    id: "v1.quest.rejectCompletedWork",
    tags: ["api", "quest"],
    description: "Reject completed work on quest",
    validate: {
      params: Joi.object({
        questId: questId.required(),
      }).label("RejectCompletedWorkParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}];
