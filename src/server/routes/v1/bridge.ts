import Joi = require('joi');
import { getRecipientSwaps } from '../../api/bridge';
import {
  bridgeSymbolSchema,
  outputOkSchema,
  offsetSchema,
  limitSchema,
  swapsSchema
} from "@workquest/database-models/lib/schemes";

export default [
  {
    method: 'GET',
    path: '/v1/bridge/recipient/{recipient}/swaps',
    handler: getRecipientSwaps,
    options: {
      auth: false,
      id: 'v1.bridge.getRecipientSwaps',
      tags: ['api', 'bridge'],
      validate: {
        params: Joi.object({
          recipient: Joi.string().required().label('RecipientHash'),
        }).label('GetBridgeSwapsParams'),
        query: Joi.object({
          symbol: bridgeSymbolSchema,
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetBridgeSwapsQuery'),
      },
      response: {
        schema: outputOkSchema(swapsSchema).label('UserResponse'),
      },
    },
  },
];
