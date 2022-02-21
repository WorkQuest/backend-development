import * as Joi from 'joi';
import * as handlers from '../../api/questDispute';
import {
  idSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  reviewMarkSchema,
  questDisputeSchema,
  reviewMessageSchema,
  questDisputeReviewSchema,
  questDisputeReasonSchema,
  questDisputesWithCountSchema,
  questDisputeProblemDescriptionSchema,
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'POST',
    path: '/v1/quest/{questId}/open-dispute',
    handler: handlers.openDispute,
    options: {
      id: 'v1.quest.dispute.open',
      auth: 'jwt-access',
      tags: ['api', 'quest-disputes'],
      description: 'Open dispute on quest',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('OpenQuestDisputeParams'),
        payload: Joi.object({
          reason: questDisputeReasonSchema.required(),
          problemDescription: questDisputeProblemDescriptionSchema.required(),
        }).label('OpenQuestDisputePayload'),
      },
      response: {
        schema: outputOkSchema(questDisputeSchema).label('OpenQuestDisputeResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/quest/dispute/{disputeId}',
    handler: handlers.getDispute,
    options: {
      id: 'v1.quest.getDispute',
      auth: 'jwt-access',
      tags: ['api', 'quest-disputes'],
      description: 'Get quest dispute',
      validate: {
        params: Joi.object({
          disputeId: idSchema.required(),
        }).label('GetDisputeParams'),
      },
      response: {
        schema: outputOkSchema(questDisputeSchema).label('GetDisputeResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/me/quest/disputes',
    handler: handlers.getDisputes,
    options: {
      id: 'v1.quest.getDisputes',
      auth: 'jwt-access',
      tags: ['api', 'quest-disputes'],
      description: 'Get quest disputes',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetDisputesQuery'),
      },
      response: {
        schema: questDisputesWithCountSchema.label('getDisputesResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/dispute/{disputeId}/review/send',
    handler: handlers.sendQuestDisputeReview,
    options: {
      id: 'v1.quest.dispute.sendReview',
      auth: 'jwt-access',
      tags: ['api', 'quest-disputes'],
      description: 'Send dispute review on admin',
      validate: {
        params: Joi.object({
          disputeId: idSchema.required(),
        }).label('QuestDisputeSendReviewParams'),
        payload: Joi.object({
          mark: reviewMarkSchema.required(),
          message: reviewMessageSchema.required(),
        }).label('QuestDisputeSendReviewPayload'),
      },
      response: {
        schema: questDisputeReviewSchema.label('QuestDisputeSendReviewResponse'),
      },
    },
  },
];
