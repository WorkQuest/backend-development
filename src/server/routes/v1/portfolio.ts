import * as Joi from 'joi';
import * as handlers from '../../api/portfolio';
import {
  idSchema,
  idsSchema,
  limitSchema,
  offsetSchema,
  emptyOkSchema,
  outputOkSchema,
  portfolioSchema,
  portfoliosSchema,
  portfolioTitleSchema,
  portfolioDescriptionSchema,
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'POST',
  path: '/v1/portfolio/add-case',
  handler: handlers.addCase,
  options: {
    auth: 'jwt-access',
    id: 'v1.portfolio.addCase',
    tags: ['api', 'portfolio'],
    description: 'Add case',
    validate: {
      payload: Joi.object({
        title: portfolioTitleSchema.required(),
        description: portfolioDescriptionSchema.default(''),
        mediaIds: idsSchema.required().unique(),
      }).label('AddCasePayload'),
    },
    response: {
      schema: outputOkSchema(portfolioSchema).label('PortfolioResponse'),
    },
  },
}, {
  method: 'GET',
  path: '/v1/user/{userId}/portfolio/cases',
  handler: handlers.getCases,
  options: {
    auth: 'jwt-access',
    id: 'v1.portfolio.getCases',
    tags: ['api', 'portfolio'],
    description: 'Get all cases for user',
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetCasesQuery'),
      params: Joi.object({
        userId: idSchema.required(),
      }).label('GetCasesParams'),
    },
    response: {
      schema: outputOkSchema(portfoliosSchema).label('PortfoliosResponse'),
    },
  },
}, {
  method: 'PUT',
  path: '/v1/portfolio/{portfolioId}',
  handler: handlers.editCase,
  options: {
    auth: 'jwt-access',
    id: 'v1.portfolio.editCase',
    tags: ['api', 'portfolio'],
    description: 'Edit case',
    validate: {
      params: Joi.object({
        portfolioId: idSchema.required(),
      }).label('EditCaseParams'),
      payload: Joi.object({
        title: portfolioTitleSchema,
        description: portfolioDescriptionSchema,
        mediaIds: idsSchema.unique().default([]),
      }).label('EditCasePayload'),
    },
    response: {
      schema: outputOkSchema(portfolioSchema).label('PortfolioResponse'),
    },
  },
}, {
  method: 'DELETE',
  path: '/v1/portfolio/{portfolioId}',
  handler: handlers.deleteCase,
  options: {
    auth: 'jwt-access',
    id: 'v1.portfolio.deleteCase',
    tags: ['api', 'portfolio'],
    description: 'Delete case',
    validate: {
      params: Joi.object({
        portfolioId: idSchema.required(),
      }).label('DeleteCaseParams'),
    },
    response: {
      schema: emptyOkSchema,
    },
  },
}];
