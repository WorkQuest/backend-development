import * as Joi from 'joi';
import * as handlers from '../../api/questDispute';
import {
  idSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  questDisputeSchema,
  questDisputeReviewSchema,
  questDisputeReasonSchema,
  questDisputesWithCountSchema,
  questDisputeReviewMarkSchema,
  questDisputeReviewMessageTextSchema,
  questDisputeProblemDescriptionSchema
} from "@workquest/database-models/lib/schemes";

export default [
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
        schema: outputOkSchema(questDisputesWithCountSchema).label('getDisputesResponse'),
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
          mark: questDisputeReviewMarkSchema.required(),
          message: questDisputeReviewMessageTextSchema.required(),
        }).label('QuestDisputeSendReviewPayload'),
      },
      response: {
        schema: outputOkSchema(questDisputeReviewSchema).label('QuestDisputeSendReviewResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/quest/{questId}/dispute',
    handler: handlers.createDispute,
    options: {
      id: 'v1.quest.dispute.createDispute',
      auth: 'jwt-access',
      tags: ['api', 'quest-disputes'],
      description: 'Create dispute',
      validate: {
        params: Joi.object({
          questId: idSchema.required(),
        }).label('QuestDisputeCreateParams'),
        payload: Joi.object({
          reason: questDisputeReasonSchema.required(),
          problemDescription: questDisputeProblemDescriptionSchema.required()
        }).label('QuestDisputeCreatePayload')
      },
      response: {
        schema: outputOkSchema(questDisputeSchema).label('QuestDisputeCreateResponse'),
      }
    }
  }
];
