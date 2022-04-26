import Joi = require('joi');
import * as handlers from '../../api/bridge';
import {
  limitSchema,
  offsetSchema,
  outputOkSchema,
  accountAddressSchema,
  bridgeSwapEventsSchema,
  bridgeSwapEventSymbolSchema,
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'GET',
  path: '/v1/bridge/recipient/{recipient}/swaps',
  handler: handlers.getRecipientSwaps,
  options: {
    auth: false,
    id: 'v1.bridge.getRecipientSwaps',
    tags: ['api', 'bridge'],
    validate: {
      params: Joi.object({
        recipient: accountAddressSchema,
      }).label('GetBridgeRecipientSwapsParams'),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
        symbol: bridgeSwapEventSymbolSchema,
      }).label('GetBridgeRecipientSwapsQuery'),
    },
    response: {
      schema: outputOkSchema(bridgeSwapEventsSchema).label('GetBridgeRecipientSwapsResponse'),
    },
  },
}];
