import * as Joi from "joi";
import * as questHandlers from '../../api/quest';
import {
  outputOkSchema,
  idSchema,
  idsSchema,
  emptyOkSchema,
  locationSchema,
  questWorkPlaceSchema,
  questAdTypeSchema,
  questCategorySchema,
  questDescriptionSchema,
  questPriceSchema,
  questPrioritySchema,
  questSchema,
  questTitleSchema,
  questQuerySchema,
  questsForGetWithCountSchema,
  questLocationPlaceNameSchema,
  questEmploymentSchema,
  specializationKeysSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "GET",
  path: "/v1/quest/{questId}",
  handler: questHandlers.getQuest,
  options: {
    id: "v1.getQuest",
    tags: ["api", "quest"],
    description: "Get quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label('GetQuestParams')
    },
    response: {
      schema: outputOkSchema(questSchema).label("GetQuestResponse"),
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/create",
  handler: questHandlers.createQuest,
  options: {
    id: "v1.quest.create",
    tags: ["api", "quest"],
    description: "Register new quest",
    validate: {
      payload: Joi.object({
        category: questCategorySchema.required(),
        workplace: questWorkPlaceSchema.required(),
        employment: questEmploymentSchema.required(),
        priority: questPrioritySchema.required(),
        locationPlaceName: questLocationPlaceNameSchema.required(),
        location: locationSchema.required(),
        title: questTitleSchema.required(),
        description: questDescriptionSchema.required(),
        price: questPriceSchema.required(),
        medias: idsSchema.required().unique(),
        adType: questAdTypeSchema.required(),
        specializationKeys: specializationKeysSchema.required().unique(),
      }).label("CreateQuestPayload")
    },
    response: {
      schema: outputOkSchema(questSchema).label("CreateQuestResponse"),
    },
  },
}, {
  method: "DELETE",
  path: "/v1/quest/{questId}",
  handler: questHandlers.deleteQuest,
  options: {
    id: "v1.quest.deleteQuest",
    tags: ["api", "quest"],
    description: "Delete quest (only status: Created and Closed)",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("DeleteQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  },
}, {
  method: "PUT",
  path: "/v1/quest/{questId}",
  handler: questHandlers.editQuest,
  options: {
    id: "v1.quest.editQuest",
    tags: ["api", "quest"],
    description: "Edit quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("EditQuestParams"),
      payload: Joi.object({
        category: questCategorySchema.required(),
        workplace: questWorkPlaceSchema.required(),
        employment: questEmploymentSchema.required(),
        priority: questPrioritySchema.required(),
        location: locationSchema.required(),
        locationPlaceName: questLocationPlaceNameSchema.required(),
        title: questTitleSchema.required(),
        description: questDescriptionSchema.required(),
        price: questPriceSchema.required(),
        adType: questAdTypeSchema.required(),
        medias: idsSchema.unique().required(),
        specializationKeys: specializationKeysSchema.unique().required(),
      }).label("EditQuestPayload"),
    },
    response: {
      schema: outputOkSchema(questSchema).label("EditQuestResponse"),
    },
  }
}, {
  method: "GET",
  path: "/v1/quests",
  handler: questHandlers.getQuests,
  options: {
    id: "v1.getQuests",
    tags: ["api", "quest"],
    description: "Get quests",
    validate: {
      query: questQuerySchema
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("GetQuestsResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/employer/{userId}/quests",
  handler: questHandlers.getQuests,
  options: {
    id: "v1.employer.quests",
    tags: ["api", "quest"],
    description: "Get quests for a given user",
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("EmployerGetQuestsParams"),
      query: questQuerySchema
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("EmployerGetQuestsResponse")
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/start",
  handler: questHandlers.startQuest,
  options: {
    id: "v1.quest.startQuest",
    tags: ["api", "quest"],
    description: "Start quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label('SetStartQuestParams'),
      payload: Joi.object({
        assignedWorkerId: idSchema.required(),
      }).label('SetStartQuestPayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/close",
  handler: questHandlers.closeQuest,
  options: {
    id: "v1.quest.closeQuest",
    tags: ["api", "quest"],
    description: "Close quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("CloseQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/reject-work",
  handler: questHandlers.rejectWorkOnQuest,
  options: {
    id: "v1.quest.rejectWork",
    tags: ["api", "quest"],
    description: "Reject work on quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("RejectWorkOnQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/accept-work",
  handler: questHandlers.acceptWorkOnQuest,
  options: {
    id: "v1.quest.acceptWork",
    tags: ["api", "quest"],
    description: "Accept work on quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("AcceptWorkOnQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/complete-work",
  handler: questHandlers.completeWorkOnQuest,
  options: {
    id: "v1.quest.completeWork",
    tags: ["api", "quest"],
    description: "Complete work on quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("CompleteWorkOnQuestParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/accept-completed-work",
  handler: questHandlers.acceptCompletedWorkOnQuest,
  options: {
    id: "v1.quest.acceptCompletedWork",
    tags: ["api", "quest"],
    description: "Accept completed work on quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("AcceptCompletedWorkParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/reject-completed-work",
  handler: questHandlers.rejectCompletedWorkOnQuest,
  options: {
    id: "v1.quest.rejectCompletedWork",
    tags: ["api", "quest"],
    description: "Reject completed work on quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("RejectCompletedWorkParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "POST",
  path: '/v1/quest/{questId}/star',
  handler: questHandlers.setStar,
  options: {
    id: 'v1.quest.star.setStar',
    tags: ["api", "quest"],
    description: 'Set star on quest',
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("SetStarParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "DELETE",
  path: '/v1/quest/{questId}/star',
  handler: questHandlers.removeStar,
  options: {
    id: 'v1.quest.star.takeAwayStar',
    tags: ["api", "quest"],
    description: 'Take away star on quest',
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("RemoveStarParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}];
