import * as Joi from 'joi';
import * as handlers from '../../api/liquidityPool(wqt-weth)';
import {
  limitSchema,
  offsetSchema,
  outputOkSchema,
  wqtSwapEventsSchema,
  outputPaginationSchema,
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
        }).label('GetWqtWethSwapsQuery'),
      },
      response: {
        schema: outputOkSchema(wqtSwapEventsSchema).label('GetWqtWethSwapsResponse'),
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
        }).label('GetWqtWethMintsQuery'),
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
        }).label('GetWqtWethBurnsQuery'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/pool-liquidity/wqt-weth/token-day',
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
        }).label('GetWqtWethTokenDayDataQuery'),
      },
      response: {
        schema: outputPaginationSchema('data', dailyLiquidityWqtWethSchema).label('GetWqtWethTokenDayDataResponse'),
      },
    },
  },
];
