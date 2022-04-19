import * as Joi from 'joi';
import * as handlers from '../../api/quest';
import {
  idSchema,
  idsSchema,
  questSchema,
  emptyOkSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  workPlaceSchema,
  questPriceSchema,
  prioritySchema,
  questTitleSchema,
  questQuerySchema,
  questsForGetSchema,
  locationFullSchema,
  questsPayloadSchema,
  questsWithCountSchema,
  questEmploymentSchema,
  questDescriptionSchema,
  specializationKeysSchema,
  questsForGetWithCountSchema,
  questQueryForMapPointsSchema,
  questQueryForGetWorkersSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "GET",
  path: "/v1/quest/{questId}",
  handler: handlers.getQuest,
  options: {
    auth: 'jwt-access',
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
  handler: handlers.createQuest,
  options: {
    auth: 'jwt-access',
    id: "v1.quest.create",
    tags: ["api", "quest"],
    description: "Register new quest",
    validate: {
      payload: Joi.object({
        workplace: workPlaceSchema.required(),
        employment: questEmploymentSchema.required(),
        priority: prioritySchema.required(),
        locationFull: locationFullSchema.required(),
        title: questTitleSchema.required(),
        description: questDescriptionSchema.required(),
        price: questPriceSchema.required(),
        medias: idsSchema.required().unique(),
        specializationKeys: specializationKeysSchema.required().unique(),
      }).label("CreateQuestPayload")
    },
    response: {
      schema: outputOkSchema(questSchema).label("CreateQuestResponse"),
    },
  },
}, {
  method: "POST",
  path: "/v1/get-quests",
  handler: handlers.getQuests('list'),
  options: {
    auth: 'jwt-access',
    id: "v1.getQuests",
    tags: ["api", "quest"],
    description: "Get quests",
    validate: {
      query: questQuerySchema,
      payload: questsPayloadSchema,
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("GetQuestsResponse")
    },
  }
}, {
  method: "POST",
  path: "/v1/employer/{userId}/get-quests",
  handler: handlers.getQuests('list'),
  options: {
    auth: 'jwt-access',
    id: "v1.employer.quests",
    tags: ["api", "quest"],
    description: "Get quests for a given user",
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("EmployerGetQuestsParams"),
      query: questQuerySchema,
      payload: questsPayloadSchema,
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("EmployerGetQuestsResponse")
    },
  }
}, {
  method: "POST",
  path: "/v1/worker/{workerId}/get-quests",
  handler: handlers.getQuests('list'),
  options: {
    auth: 'jwt-access',
    id: "v1.worker.quests",
    tags: ["api", "quest"],
    description: "Get quests for a given user",
    validate: {
      params: Joi.object({
        workerId: idSchema.required(),
      }).label("WorkerGetQuestsParams"),
      query: questQueryForGetWorkersSchema,
      payload: questsPayloadSchema,
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("WorkerGetQuestsResponse")
    },
  }
}, {
  method: "POST",
  path: "/v1/me/employer/get-quests",
  handler: handlers.getQuests('list', 'employer'),
  options: {
    auth: 'jwt-access',
    id: "v1.me.employer.quests",
    tags: ["api", "quest"],
    description: "Get quests for me as employer (created by me)",
    validate: {
      query: questQuerySchema,
      payload: questsPayloadSchema,
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("EmployerGetQuestsResponse")
    },
  }
}, {
  method: "POST",
  path: "/v1/me/worker/get-quests",
  handler: handlers.getQuests('list', 'worker'),
  options: {
    auth: 'jwt-access',
    id: "v1.me.worker.quests",
    tags: ["api", "quest"],
    description: "Get quests for me as worker (executed by me)",
    validate: {
      query: questQuerySchema,
      payload: questsPayloadSchema,
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("WorkerGetQuestsResponse")
    },
  }
}, {
  method: "POST",
  path: "/v1/quest/map/get-points",
  handler: handlers.getQuests('points'),
  options: {
    auth: 'jwt-access',
    id: "v1.quest.getMapPoints",
    tags: ["api", "quest"],
    description: "Get quest map points",
    validate: {
      payload: questsPayloadSchema,
      query: questQueryForMapPointsSchema,
    },
    response: {
      schema: outputOkSchema(questsForGetSchema).label("GetQuestMapPointsResponse")
    },
  }
}, {
  method: "POST",
  path: '/v1/quest/{questId}/star',
  handler: handlers.setStar,
  options: {
    auth: 'jwt-access',
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
  handler: handlers.removeStar,
  options: {
    auth: 'jwt-access',
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
}, {
  method: "GET",
  path: "/v1/worker/{workerId}/available-quests",
  handler: handlers.getAvailableQuestsForWorker,
  options: {
    auth: 'jwt-access',
    id: "v1.quest.getAvailableQuestsForWorker",
    tags: ["api", "quest"],
    description: "Get available quests for worker ",
    validate: {
      params: Joi.object({
        workerId: idSchema.required(),
      }).label("GetAvailableQuestsForWorkerParams"),
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetAvailableQuestsForWorkerQuery'),
    },
    response: {
      schema: outputOkSchema(questsWithCountSchema).label("GetAvailableQuestsForWorkerResponse")
    },
  }
}, {
  method: "PUT",
  path: '/v1/quest/{questId}/edit',
  handler: handlers.editQuest,
  options: {
    auth: 'jwt-access',
    id: 'v1.quest.edit',
    tags: ["api", "quest"],
    description: 'Edit quest',
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("EditQuestParams"),
      payload: Joi.object({
        workplace: workPlaceSchema.required(),
        employment: questEmploymentSchema.required(),
        priority: prioritySchema.required(),
        locationFull: locationFullSchema.required(),
        title: questTitleSchema.required(),
        medias: idsSchema.unique().required(),
        specializationKeys: specializationKeysSchema.unique().required(),
      }).label("EditQuestPayload"),
    },
    response: {
      schema: outputOkSchema(questSchema).label("EditQuestResponse"),
    },
  }
}];
