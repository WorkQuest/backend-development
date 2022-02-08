import * as Joi from 'joi';
import * as handlers from '../../api/liquidityPool(wqt-wbnb)';
import {
  limitSchema,
  offsetSchema,
  outputOkSchema,
  dailyLiquiditySchema,
  wqtWbnbSwapEventsSchema,
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'GET',
    path: '/v1/pool-liquidity/wqt-wbnb/swaps',
    handler: handlers.getSwaps,
    options: {
      auth: false,
      id: 'v1.liquidity.wqt-wbnb.getSwaps',
      tags: ['api', 'pool-liquidity'],
      description: 'Get swaps on a pair by fetching Swap events',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetSwapsWQTQuery'),
      },
      response: {
        schema: outputOkSchema(wqtWbnbSwapEventsSchema).label('GetSwapsWQTResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/pool-liquidity/wqt-wbnb/mints',
    handler: handlers.getMints,
    options: {
      auth: false,
      id: 'v1.liquidity.wqt-wbnb.getMints',
      tags: ['api', 'pool-liquidity'],
      description: 'Get mints on a pair by fetching Mint events',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetMintsWQTQuery'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/pool-liquidity/wqt-wbnb/tokenDay',
    handler: handlers.getTokenDayData,
    options: {
      auth: false,
      id: 'v1.liquidity.wqt-wbnb.getTokenDayData',
      tags: ['api', 'pool-liquidity'],
      description: 'Get daily information for DAI',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetTokenDayDataQuery'),
      },
      response: {
        schema: outputOkSchema(dailyLiquiditySchema).label('GetTokenDayDataResponse'),
      },
    },
  },
];
