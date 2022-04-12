import * as Joi from 'joi';
import * as handlers from '../../api/savingProduct';
import {
  outputPaginationSchema,
  paginationFields,
  savingProductEventSchema
} from "@workquest/database-models/lib/schemes";

export default [{
  method: 'GET',
  path: '/v1/saving-product/received',
  handler: handlers.getReceivedEvents,
  options: {
    auth: 'jwt-access',
    id: 'v1.saving-product.getReceivedEvents',
    description: 'Get received events for user wallet',
    tags: ['api', 'saving-product'],
    validate: {
      query: Joi.object({
        ...paginationFields
      }).label('GetReceivedEventsQuery')
    },
    response: {
      schema: outputPaginationSchema('events', savingProductEventSchema)
        .label('GetReceivedEventsResponse')
    }
  }
}]
