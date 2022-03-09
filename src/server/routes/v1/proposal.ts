import * as Joi from 'joi';
import * as handlers from '../../api/proposal';
import {
  idsSchema,
  limitSchema,
  searchSchema,
  offsetSchema,
  outputOkSchema,
  proposalSchema,
  sortDirectionSchema,
  proposalTitleSchema,
  proposalStatusSchema,
  proposalNumberSchema,
  proposerIdWalletSchema,
  proposalDescriptionSchema,
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'POST',
    path: '/v1/proposal/create',
    handler: handlers.createProposal,
    options: {
      auth: 'jwt-access',
      id: 'v1.createProposal',
      tags: ['api', 'proposal'],
      description: 'Create proposal',
      validate: {
        payload: Joi.object({
          proposer: proposerIdWalletSchema.required(),
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
    path: '/v1/proposal',
    handler: handlers.getProposals,
    options: {
      auth: 'jwt-access',
      id: 'v1.getProposals',
      tags: ['api', 'proposal'],
      description: 'Get proposal',
      validate: {
        query: Joi.object({
          q: searchSchema,
          limit: limitSchema,
          offset: offsetSchema,
          createdAt: sortDirectionSchema.default('DESC'),
          status: proposalStatusSchema.default(null),
        }).label('GetProposalsQuery'),
      },
      response: {
        schema: outputOkSchema(proposalSchema).label('GetProposalsResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/proposal/{proposalId}',
    handler: handlers.getProposal,
    options: {
      auth: 'jwt-access',
      id: 'v1.getProposal',
      tags: ['api', 'proposal'],
      description: 'Get proposal',
      validate: {
        params: Joi.object({
          proposalId: proposalNumberSchema.required(),
        }).label('GetProposalParams'),
      },
      response: {
        schema: outputOkSchema(proposalSchema).label('GetProposalResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/votings/{proposalId}',
    handler: handlers.getVotingsProposal,
    options: {
      auth: 'jwt-access',
      id: 'v1.getVotingsProposal',
      tags: ['api', 'proposal'],
      description: 'Get voting in proposal',
      validate: {
        params: Joi.object({
          proposalId: proposalNumberSchema.required(),
        }).label('GetProposalParams'),
        query: Joi.object({
          limit: limitSchema,
          offset: offsetSchema,
          createdAt: sortDirectionSchema.default('DESC'),
          support: Joi.boolean().label('VotingProposalSupport'),
        }).label('GetVotingsQuery'),
      },
      response: {
        schema: outputOkSchema(proposalSchema).label('GetVotingsProposalResponse'),
      },
    },
  },
];
