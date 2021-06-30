import * as Joi from "joi";
import { emptyOkSchema, idSchema } from '../../schemes';
import { descriptionSchema, portfolioSchema, titleSchema } from '../../schemes/portfolio';
import { addCase, deleteCase, editCase, getCases } from '../../api/portfolio';
import { mediaIdsSchema } from '../../schemes/media';

const userIdSchema = idSchema.label("UserId");
const portfolioIdSchema = idSchema.label('PortfolioId');

export default [{
  method: "POST",
  path: "/v1/portfolio/add-case",
  handler: addCase,
  options: {
    id: "v1.portfolio.addCase",
    tags: ["api", "portfolio"],
    description: "Add case",
    validate: {
      payload: Joi.object({
        title: titleSchema.required(),
        description: descriptionSchema.default(''),
        medias: mediaIdsSchema.required().unique().label('Medias'),
      }).label('AddCasePayload')
    },
    response: {
      schema: portfolioSchema
    }
  }
}, {
  method: "GET",
  path: "/v1/user/{userId}/portfolio/cases",
  handler: getCases,
  options: {
    id: "v1.portfolio.getCases",
    tags: ["api", "portfolio"],
    description: "Get all cases for user",
    validate: {
      params: Joi.object({
        userId: userIdSchema
      }).label('GetCasesParams')
    },
    response: {
      schema: Joi.array().items(portfolioSchema).label('CasesResponse')
    }
  }
}, {
  method: "PUT",
  path: "/v1/portfolio/{portfolioId}",
  handler: editCase,
  options: {
    id: "v1.portfolio.editCase",
    tags: ["api", "portfolio"],
    description: "Edit case",
    validate: {
      params: Joi.object({
        portfolioId: portfolioIdSchema
      }).label('EditCaseParams'),
      payload: Joi.object({
        title: titleSchema,
        description: descriptionSchema,
        medias: mediaIdsSchema.unique().label('Medias'),
      }).label('EditCasePayload')
    },
    response: {
      schema: portfolioSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/portfolio/{portfolioId}",
  handler: deleteCase,
  options: {
    id: "v1.portfolio.deleteCase",
    tags: ["api", "portfolio"],
    description: "Delete case",
    validate: {
      params: Joi.object({
        portfolioId: portfolioIdSchema
      }).label('DeleteCaseParams')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}]
