import * as Joi from "joi";
import { addCase, deleteCase, editCase, getCases } from "../../api/portfolio";
import {
  outputOkSchema,
  emptyOkSchema,
  idSchema,
  portfolioDescriptionSchema,
  portfolioSchema,
  portfolioTitleSchema,
  portfoliosSchema,
  mediaIdsSchema,
} from "@workquest/database-models/lib/schemes";

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
        title: portfolioTitleSchema.required(),
        description: portfolioDescriptionSchema.default(""),
        medias: mediaIdsSchema.required().unique().label("Medias")
      }).label('AddCasePayload')
    },
    response: {
      schema: outputOkSchema(portfolioSchema).label('PortfolioResponse'),
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
        userId: idSchema
      }).label('GetCasesParams')
    },
    response: {
      schema: outputOkSchema(portfoliosSchema).label('PortfoliosResponse'),
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
        portfolioId: idSchema
      }).label('EditCaseParams'),
      payload: Joi.object({
        title: portfolioTitleSchema,
        description: portfolioDescriptionSchema,
        medias: mediaIdsSchema.unique().label("Medias")
      }).label('EditCasePayload')
    },
    response: {
      schema: outputOkSchema(portfolioSchema).label('PortfolioResponse'),
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
        portfolioId: idSchema
      }).label('DeleteCaseParams')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}]
