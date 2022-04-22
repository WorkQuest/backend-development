import * as Joi from 'joi';
import * as handlers from '../../api/liquidityPool(wqt-weth)';
import {
  limitSchema,
  offsetSchema,
  outputOkSchema,
  wqtSwapEventsSchema,
  dailyLiquidityWqtWethSchema,
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'GET',
    path: '/v1/pool-liquidity/wqt-weth/swaps',
    handler: handlers.getSwaps,
    options: {
      auth: false,
      id: 'v1.liquidity.wqt-weth.getSwaps',
      tags: ['api', 'pool-liquidity'],
      description: 'Get swaps on a pair by fetching Swap events',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetSwapsWQTQuery'),
      },
      response: {
        schema: outputOkSchema(wqtSwapEventsSchema).label('GetSwapsWQTResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/pool-liquidity/wqt-weth/mints',
    handler: handlers.getMints,
    options: {
      auth: false,
      id: 'v1.liquidity.wqt-weth.getMints',
      tags: ['api', 'pool-liquidity'],
      description: 'Get mints on a pair by fetching Mints events',
      validate: {
        query: Joi.object({
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetMintsWQTQuery'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/pool-liquidity/wqt-weth/burns',
    handler: handlers.getBurns,
    options: {
      auth: false,
      id: 'v1.liquidity.wqt-weth.getSBurns',
      tags: ['api', 'pool-liquidity'],
      description: 'Get burns on a pair by fetching Burns events',
      validate: {
        query: Joi.object({
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetBurnsWQTQuery'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/pool-liquidity/wqt-weth/tokenDay',
    handler: handlers.getTokenDayData,
    options: {
      auth: false,
      id: 'v1.liquidity.wqt-weth.getTokenDayData',
      tags: ['api', 'pool-liquidity'],
      description: 'Get daily information for DAI',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetTokenDayDataQuery'),
      },
      response: {
        schema: outputOkSchema(dailyLiquidityWqtWethSchema).label('GetTokenDayDataResponse'),
      },
    },
  },
];
