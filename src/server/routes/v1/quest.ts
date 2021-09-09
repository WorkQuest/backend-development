import * as Joi from "joi";
import {
  acceptCompletedWorkOnQuest,
  acceptWorkOnQuest,
  closeQuest,
  completeWorkOnQuest,
  createQuest,
  deleteQuest,
  editQuest,
  getMyStarredQuests,
  getQuests,
  rejectCompletedWorkOnQuest,
  rejectWorkOnQuest,
  setStar,
  startQuest,
  removeStar,
  getQuest,
} from '../../api/quest';
import {
  outputOkSchema,
  idSchema,
  emptyOkSchema,
  locationSchema,
  questAdTypeSchema,
  questCategorySchema,
  questDescriptionSchema,
  questPriceSchema,
  questPrioritySchema,
  questSchema,
  questTitleSchema,
  questsQuerySchema,
  questsSchema,
  questsForGetWithCountSchema,
  questLocationPlaceNameSchema, questWorkPlacementSchema, idsSchema
} from "@workquest/database-models/lib/schemes";

const questIdSchema = idSchema.label('QuestId');
const userIdSchema = idSchema.label('UserId');

export default [{
  method: "GET",
  path: "/v1/quest/{questId}",
  handler: getQuest,
  options: {
    id: "v1.getQuest",
    tags: ["api", "quest"],
    description: "Get quest",
    validate: {
      params: Joi.object({
        questId: questIdSchema
      }).label('GetQuestParams')
    },
    response: {
      schema: outputOkSchema(questSchema).label("QuestResponse"),
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/create",
  handler: createQuest,
  options: {
    id: "v1.quest.create",
    tags: ["api", "quest"],
    description: "Register new quest",
    validate: {
      payload: Joi.object({
        category: questCategorySchema.required(),
        placement: questWorkPlacementSchema.required(),
        priority: questPrioritySchema.required(),
        locationPlaceName: questLocationPlaceNameSchema.required(),
        location: locationSchema.required(),
        title: questTitleSchema.required(),
        description: questDescriptionSchema.required(),
        price: questPriceSchema.required(),
        medias: idsSchema.required().unique().label('MediaIds'),
        adType: questAdTypeSchema,
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
        questId: questIdSchema.required(),
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
        questId: questIdSchema.required(),
      }).label("EditQuestParams"),
      payload: Joi.object({
        category: questCategorySchema,
        placement: questWorkPlacementSchema.required(),
        priority: questPrioritySchema,
        location: locationSchema,
        locationPlaceName: questLocationPlaceNameSchema,
        title: questTitleSchema,
        description: questDescriptionSchema,
        price: questPriceSchema,
        adType: questAdTypeSchema,
        medias: idsSchema.unique().label('MediaIds'),
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
    id: "v1.getQuests",
    tags: ["api", "quest"],
    description: "Get quests",
    validate: {
      query: questsQuerySchema
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("QuestsWithCountResponse")
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
        userId: userIdSchema
      }).label("EmployerQuestsParams"),
      query: questsQuerySchema
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("QuestsWithCountResponse")
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
      params: Joi.object({
        questId: questIdSchema,
      }).label('StartQuestParams'),
      payload: Joi.object({
        assignedWorkerId: userIdSchema,
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
        questId: questIdSchema.required(),
      }).label("CloseQuestParams")
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
        questId: questIdSchema.required(),
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
        questId: questIdSchema.required(),
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
        questId: questIdSchema.required(),
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
        questId: questIdSchema.required(),
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
        questId: questIdSchema.required(),
      }).label("RejectCompletedWorkParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "GET",
  path: '/v1/quests/starred',
  handler: getMyStarredQuests,
  options: {
    id: 'v1.quest.starred',
    tags: ["api", "quest"],
    description: 'Get starred quests',
    response: {
      schema: outputOkSchema(questsSchema).label("QuestsWithCountResponse")
    },
  },
}, {
  method: "POST",
  path: '/v1/quest/{questId}/star',
  handler: setStar,
  options: {
    id: 'v1.quest.star.setStar',
    tags: ["api", "quest"],
    description: 'Set star on quest',
    validate: {
      params: Joi.object({
        questId: questIdSchema.required(),
      }).label("StarParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}, {
  method: "DELETE",
  path: '/v1/quest/{questId}/star',
  handler: removeStar,
  options: {
    id: 'v1.quest.star.takeAwayStar',
    tags: ["api", "quest"],
    description: 'Take away star on quest',
    validate: {
      params: Joi.object({
        questId: questIdSchema.required(),
      }).label("StarParams")
    },
    response: {
      schema: emptyOkSchema
    },
  }
}];
