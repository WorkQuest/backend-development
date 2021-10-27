import Joi = require("joi");
import { getRecipientSwaps } from "../../api/bridge";
import {
  limitSchema,
  offsetSchema,
  outputOkSchema,
} from "@workquest/database-models/lib/schemes";

// TODO: перенести в data-base-models
const swapSchema = Joi.object({
  canRedeemed: Joi.boolean().label('CanRedeemed'),
  blockNumber: Joi.number().label('BlockNumber'),
  transactionHash: Joi.string().label('TransactionHash'),
  nonce: Joi.number().label('Nonce'),
  timestamp: Joi.string().label('Timestamp'),
  initiator: Joi.string().label('Initiator'),
  recipient: Joi.string().label('Recipient'),
  amount: Joi.string().label('Amount'),
  chainTo: Joi.number().label('ChainTo'),
  chainFrom: Joi.number().label('ChainFrom'),
  symbol: Joi.string().label('Symbol'),
  signData: Joi.array().items(Joi.string()).label('SignData'),
}).label('Swaps');

const swapsSchema = Joi.array().items(swapSchema).label('Swaps');

export default [{
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
      }).label("GetBridgeSwapsParams"),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetBridgeSwapsQuery'),
    },
    response: {
      schema: outputOkSchema(swapsSchema).label("UserResponse")
    },
  }
}];
