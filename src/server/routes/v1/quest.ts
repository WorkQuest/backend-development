import * as Joi from 'joi';
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
  chatForGetSchema,
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'GET',
    path: '/v1/quest/{questId}',
    handler: handlers.getQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.getQuest',
      tags: ['api', 'quest'],
      description: 'Get quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('GetQuestParams'),
      },
      response: {
        schema: outputOkSchema(questSchema).label('GetQuestResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/create',
    handler: handlers.createQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.create',
      tags: ['api', 'quest'],
      description: 'Register new quest',
      validate: {
        payload: Joi.object({
          category: questCategorySchema.required(),
          workplace: workPlaceSchema.required(),
          employment: questEmploymentSchema.required(),
          priority: prioritySchema.required(),
          locationPlaceName: questLocationPlaceNameSchema.required(),
          location: locationSchema.required(),
          title: questTitleSchema.required(),
          description: questDescriptionSchema.required(),
          price: questPriceSchema.required(),
          medias: idsSchema.required().unique(),
          adType: questAdTypeSchema.required(),
          specializationKeys: specializationKeysSchema.required().unique(),
        }).label('CreateQuestPayload'),
      },
      response: {
        schema: outputOkSchema(questSchema).label('CreateQuestResponse'),
      },
    },
  },
  {
    method: 'DELETE',
    path: '/v1/quest/{questId}',
    handler: handlers.deleteQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.deleteQuest',
      tags: ['api', 'quest'],
      description: 'Delete quest (only status: Created and Closed)',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('DeleteQuestParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'PUT',
    path: '/v1/quest/{questId}',
    handler: handlers.editQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.editQuest',
      tags: ['api', 'quest'],
      description: 'Edit quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('EditQuestParams'),
        payload: Joi.object({
          category: questCategorySchema.required(),
          workplace: workPlaceSchema.required(),
          employment: questEmploymentSchema.required(),
          priority: prioritySchema.required(),
          location: locationSchema.required(),
          locationPlaceName: questLocationPlaceNameSchema.required(),
          title: questTitleSchema.required(),
          description: questDescriptionSchema.required(),
          price: questPriceSchema.required(),
          adType: questAdTypeSchema.required(),
          medias: idsSchema.unique().required(),
          specializationKeys: specializationKeysSchema.unique().required(),
        }).label('EditQuestPayload'),
      },
      response: {
        schema: outputOkSchema(questSchema).label('EditQuestResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/quests',
    handler: handlers.getQuests,
    options: {
      auth: 'jwt-access',
      id: 'v1.getQuests',
      tags: ['api', 'quest'],
      description: 'Get quests',
      validate: {
        query: questQuerySchema,
      },
      response: {
        schema: outputOkSchema(questsForGetWithCountSchema).label('GetQuestsResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/employer/{userId}/quests',
    handler: handlers.getQuests,
    options: {
      auth: 'jwt-access',
      id: 'v1.employer.quests',
      tags: ['api', 'quest'],
      description: 'Get quests for a given user',
      validate: {
        params: Joi.object({
          userId: idSchema.required(),
        }).label('EmployerGetQuestsParams'),
        query: questQuerySchema,
      },
      response: {
        schema: outputOkSchema(questsForGetWithCountSchema).label('EmployerGetQuestsResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/worker/{workerId}/quests',
    handler: handlers.getQuests,
    options: {
      auth: 'jwt-access',
      id: 'v1.worker.quests',
      tags: ['api', 'quest'],
      description: 'Get quests for a given user',
      validate: {
        params: Joi.object({
          workerId: idSchema.required(),
        }).label('WorkerGetQuestsParams'),
        query: questQuerySchema,
      },
      response: {
        schema: outputOkSchema(questsForGetWithCountSchema).label('WorkerGetQuestsResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/{questId}/start',
    handler: handlers.startQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.startQuest',
      tags: ['api', 'quest'],
      description: 'Start quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('SetStartQuestParams'),
        payload: Joi.object({
          assignedWorkerId: idSchema.required(),
        }).label('SetStartQuestPayload'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/{questId}/close',
    handler: handlers.closeQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.closeQuest',
      tags: ['api', 'quest'],
      description: 'Close quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('CloseQuestParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/{questId}/reject-work',
    handler: handlers.rejectWorkOnQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.rejectWork',
      tags: ['api', 'quest'],
      description: 'Reject work on quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('RejectWorkOnQuestParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/{questId}/accept-work',
    handler: handlers.acceptWorkOnQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.acceptWork',
      tags: ['api', 'quest'],
      description: 'Accept work on quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('AcceptWorkOnQuestParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/{questId}/complete-work',
    handler: handlers.completeWorkOnQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.completeWork',
      tags: ['api', 'quest'],
      description: 'Complete work on quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('CompleteWorkOnQuestParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/{questId}/accept-completed-work',
    handler: handlers.acceptCompletedWorkOnQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.acceptCompletedWork',
      tags: ['api', 'quest'],
      description: 'Accept completed work on quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('AcceptCompletedWorkParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/{questId}/star',
    handler: handlers.setStar,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.star.setStar',
      tags: ['api', 'quest'],
      description: 'Set star on quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('SetStarParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'DELETE',
    path: '/v1/quest/{questId}/star',
    handler: handlers.removeStar,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.star.takeAwayStar',
      tags: ['api', 'quest'],
      description: 'Take away star on quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('RemoveStarParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
];
