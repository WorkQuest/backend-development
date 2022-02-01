import * as Joi from 'joi';
import * as handlers from '../../api/pensionFund';
import {
  limitSchema,
  offsetSchema,
  outputOkSchema,
  pensionFundsEventsScheme,
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'GET',
    path: '/v1/pension-fund/wallet-update',
    handler: handlers.getWalletUpdate,
    options: {
      auth: false,
      id: 'v1.pensionFund.getWalletUpdate',
      tags: ['api', 'pension-fund'],
      description: 'Get wallet update events',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetClaimQuery'),
      },
      response: {
        schema: outputOkSchema(pensionFundsEventsScheme).label('GetClaimResponse'),
      },
    },
  }, {
    method: 'GET',
    path: '/v1/pension-fund/receive',
    handler: handlers.getReceive,
    options: {
      auth: false,
      id: 'v1.pensionFund.getReceive',
      tags: ['api', 'pension-fund'],
      description: 'Get receive events',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetReceiveQuery'),
      },
      response: {
        schema: outputOkSchema(pensionFundsEventsScheme).label('GetReceiveResponse'),
      },
    },
  }, {
    method: 'GET',
    path: '/v1/pension-fund/withdraw',
    handler: handlers.getWithdraw,
    options: {
      auth: false,
      id: 'v1.pensionFund.getWithdraw',
      tags: ['api', 'pension-fund'],
      description: 'Get withdraw events',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetWithdrawQuery'),
      },
      response: {
        schema: outputOkSchema(pensionFundsEventsScheme).label('GetWithdrawResponse'),
      },
    },
  },
];
