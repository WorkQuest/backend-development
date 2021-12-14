import * as Joi from "joi";
//import * as handlers from "../../api/proposal";
import {
  idSchema,
  idsSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  emptyOkSchema
} from '@workquest/database-models/lib/schemes';
import {
  allProposalsSchema,
  proposalDescriptionSchema,
  proposalSchema,
  proposalTitleSchema
} from '@workquest/database-models/lib/schemes/proposal';
import * as handlers from '../../api/proposal';

export default [{
  method: "GET",
  path: "/v1/proposals",
  handler: handlers.getProposals,
  options: {
    auth: 'jwt-access',
    id: "v1.getProposals",
    tags: ["api", "proposal"],
    description: "Get proposals",
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label("GetProposalsQuery")
    },
    response: {
      schema: outputOkSchema(proposalSchema).label("GetProposalsResponse")
    }
  }
}, {
  method: "GET",
  path: "/v1/proposal/{proposalId}",
  handler: handlers.getProposal,
  options: {
    auth: 'jwt-access',
    id: "v1.getProposal",
    tags: ["api", "proposal"],
    description: "Get proposal",
    validate: {
      params: Joi.object({
        proposalId: idSchema.required(),
      }).label('GetProposalParams')
    },
    response: {
      schema: outputOkSchema(proposalSchema).label("GetProposalResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/proposal/create",
  handler: handlers.createProposal,
  options: {
    auth: 'jwt-access',
    id: "v1.createProposal",
    tags: ["api", "proposal"],
    description: "Create proposal",
    validate: {
     payload: Joi.object({
       title: proposalTitleSchema.required(),
       description: proposalDescriptionSchema.required(),
       medias: idsSchema.required().unique(),
     }).label('CreateProposalPayload'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: 'GET',
  path: '/v1/history/proposals',
  handler: handlers.getHistoryProposals,
  options: {
    auth: 'jwt-access',
    id: 'v1.getHistoryProposals',
    tags: ['api', 'proposal'],
    description: 'Get all events ProposalCreated',
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema
      }).label('GetHistoryProposals')
    },
    response: {
      schema: outputOkSchema(allProposalsSchema).label('GetHistoryProposalsResponse')
    }
  }
}];

