import * as Joi from 'joi';
import * as handlers from '../../api/proposal';
import {
  idSchema,
  idsSchema,
  outputOkSchema,
  proposalSchema,
  proposalQuerySchema,
  proposalTitleSchema,
  outputPaginationSchema,
  proposalDescriptionSchema,
  proposalVoteCastEventSchema,
  proposalVoteCastEventQuerySchema,
  walletAddressSchema,
  limitSchema,
  offsetSchema,
  proposalDelegateChangedEventSchema,
  proposalDelegateVotesChangedEventSchema, proposalDelegateUserHistorySchema
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'POST',
    path: '/v1/proposal/create',
    handler: handlers.createProposal,
    options: {
      auth: 'jwt-access',
      id: 'v1.proposal.createProposal',
      tags: ['api', 'proposal'],
      description: 'Create proposal',
      validate: {
        payload: Joi.object({
          title: proposalTitleSchema.required(),
          description: proposalDescriptionSchema.required(),
          medias: idsSchema.required().unique(),
        }).label('CreateProposalPayload'),
      },
      response: {
        schema: outputOkSchema(proposalSchema).label('CreateProposalResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/proposals',
    handler: handlers.getProposals,
    options: {
      auth: 'jwt-access',
      id: 'v1.proposal.getProposals',
      tags: ['api', 'proposal'],
      description: 'Get proposal',
      validate: {
        query: proposalQuerySchema,
      },
      response: {
        schema: outputPaginationSchema('proposals', proposalSchema).label("GetProposalsResponse")
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/proposal/{proposalId}',
    handler: handlers.getProposal,
    options: {
      auth: 'jwt-access',
      id: 'v1.proposal.getProposal',
      tags: ['api', 'proposal'],
      description: 'Get proposal',
      validate: {
        params: Joi.object({
          proposalId: idSchema.required(),
        }).label('GetProposalParams'),
      },
      response: {
        schema: outputOkSchema(proposalSchema).label('GetProposalResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/proposal/{proposalId}/votes',
    handler: handlers.getVoteCastEventsProposal,
    options: {
      auth: 'jwt-access',
      id: 'v1.proposal.getVoteCastEventsProposal',
      tags: ['api', 'proposal'],
      description: 'Get vote in proposal',
      validate: {
        params: Joi.object({
          proposalId: idSchema.required(),
        }).label('GetVotesProposalParams'),
        query: proposalVoteCastEventQuerySchema,
      },
      response: {
        schema: outputPaginationSchema('votes', proposalVoteCastEventSchema).label('GetVotesProposalResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/proposal/delegate/changed',
    handler: handlers.getDelegateChangedEvents,
    options: {
      auth: 'jwt-access',
      id: 'v1.proposal.getDelegateChangedEvents',
      tags: ['api', 'proposal'],
      description: 'Get delegate changed events',
      validate: {
        query: Joi.object({
          delegator: walletAddressSchema,
          fromDelegate: walletAddressSchema,
          toDelegate: walletAddressSchema,
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetDelegateChangedEventsQuery'),
      },
      response: {
        schema: outputPaginationSchema('delegates', proposalDelegateChangedEventSchema)
          .label('GetDelegateChangedEventsResponse'),
      }
    }
  },
  {
    method: 'GET',
    path: '/v1/proposal/delegate/votes',
    handler: handlers.getDelegateVotesChangedEvents,
    options: {
      auth: 'jwt-access',
      id: 'v1.proposal.getDelegateVotesChangedEvents',
      tags: ['api', 'proposal'],
      description: 'Get delegate votes changed events',
      validate: {
        query: Joi.object({
          delegator: walletAddressSchema,
          delegatee: walletAddressSchema,
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetDelegateVotesChangedEventsQuery'),
      },
      response: {
        schema: outputPaginationSchema('votes', proposalDelegateVotesChangedEventSchema)
          .label('GetDelegateVotesChangedEventsResponse'),
      }
    }
  },
  {
    method: 'GET',
    path: '/v1/proposal/delegate/my',
    handler: handlers.getMyDelegateHistory,
    options: {
      auth: 'jwt-access',
      id: 'v1.proposal/getMyDelegatesHistory',
      tags: ['api', 'proposal'],
      description: 'Get delegates history for user',
      response: {
        schema: outputPaginationSchema('delegates', proposalDelegateUserHistorySchema)
          .label('GetMyDelegatesHistoryResponse'),
      }
    }
  }
];
