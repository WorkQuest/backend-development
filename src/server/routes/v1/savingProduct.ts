import * as Joi from 'joi';
import * as handlers from '../../api/savingProduct';
import {
  limitSchema, offsetSchema,
  outputPaginationSchema,
  savingProductEventSchema
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'GET',
  path: '/v1/saving-product/received',
  handler: handlers.getReceivedEvents,
  options: {
    auth: 'jwt-access',
    id: 'v1.savingProduct.getReceivedEvents',
    description: 'Get received events for user wallet',
    tags: ['api', 'saving-product'],
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema
      }).label('GetReceivedEventsQuery')
    },
    response: {
      schema: outputPaginationSchema('events', savingProductEventSchema)
        .label('GetReceivedEventsResponse')
    }
  }
}]
