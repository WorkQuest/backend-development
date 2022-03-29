import * as handlers from '../../api/borrowing';
import * as Joi from 'joi';
import {
  borrowingCollateralSchema,
  borrowingSchemaWithEvents,
  borrowingCreditSchema,
  borrowingSymbolSchema,
  borrowingTermSchema,
  borrowingSchema,
  outputOkSchema
} from "@workquest/database-models/lib/schemes";

export default [{
  method: 'POST',
  path: '/v1/borrowing/create',
  handler: handlers.createBorrowing,
  options: {
    id: 'v1.borrowing.createBorrowing',
    tags: ['api', 'borrowing'],
    description: 'Create borrowing',
    validate: {
      payload: Joi.object({
        term: borrowingTermSchema.required(),
        collateral: borrowingCollateralSchema.required(),
        credit: borrowingCreditSchema.required(),
        symbol: borrowingSymbolSchema.required()
      }).label('CreateBorrowingPayload'),
    },
    response: {
      schema: outputOkSchema(borrowingSchema).label('CreateBorrowingResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/borrowing',
  handler: handlers.getBorrowings,
  options: {
    id: 'v1.borrowing.getBorrowing',
    tags: ['api', 'borrowing'],
    description: 'Get active borrowing',
    response: {
      schema: outputOkSchema(borrowingSchemaWithEvents).label('GetBorrowingResponse')
    }
  }
}];
