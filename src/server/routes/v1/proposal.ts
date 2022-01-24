import * as Joi from 'joi';
import {
  idsSchema,
  isActiveSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  proposalNumberSchema,
  proposalStatus,
  proposerIdWalletSchema,
  searchSchema,
  sortDirectionSchema,
} from '@workquest/database-models/lib/schemes';
import { proposalDescriptionSchema, proposalSchema, proposalTitleSchema } from '@workquest/database-models/lib/schemes/proposal';
import { createProposal, getProposal, getProposals, getVotingsProposal } from '../../api/proposal';

export default [
  {
    method: 'POST',
    path: '/v1/proposal/create',
    handler: createProposal,
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
    handler: getProposals,
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
          status: proposalStatus.default(null),
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
    handler: getProposal,
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
    handler: getVotingsProposal,
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
          support: isActiveSchema,
        }).label('GetVotingsQuery'),
      },
      response: {
        schema: outputOkSchema(proposalSchema).label('GetVotingsProposalResponse'),
      },
    },
  },
];
