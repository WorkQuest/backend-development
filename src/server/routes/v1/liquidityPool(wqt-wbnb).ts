import * as Joi from "joi";
import { getBurns, getMints, getSwaps, getTokenDayData } from "../../api/liquidityPool(wqt-wbnb)";
import {
  outputOkSchema,
  tokensDayWQTSchema,
  swapWQTSchema,
  offsetSchema,
  limitSchema, emptyOkSchema
} from '@workquest/database-models/lib/schemes';
import { wqtDistribution } from '../../api/wqtDistribution';

export default [{
  method: "GET",
  path: "/v1/pool-liquidity/wqt-wbnb/swaps",
  handler: getSwaps,
  options: {
    auth: false,
    id: "v1.liquidity.wqt-wbnb.getSwaps",
    tags: ["api", "pool-liquidity"],
    description: "Get swaps on a pair by fetching Swap events",
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema
      }).label("GetSwapsWQTQuery")
    },
    response: {
      schema: outputOkSchema(swapWQTSchema).label("GetSwapsWQTResponse")
    }
  }
}, {
  method: "GET",
  path: "/v1/pool-liquidity/wqt-wbnb/mints",
  handler: getMints,
  options: {
    auth: false,
    id: "v1.liquidity.wqt-wbnb.getMints",
    tags: ["api", "pool-liquidity"],
    description: "Get mints on a pair by fetching Mints events",
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema
      }).label("GetMintsCounts")
    },
    response: {
      schema: outputOkSchema(swapWQTSchema).label("GetMintsWQTResponse")
    }
  }
}, {
  method: "GET",
  path: "/v1/pool-liquidity/wqt-wbnb/burns",
  handler: getBurns,
  options: {
    auth: false,
    id: "v1.liquidity.wqt-wbnb.getSBurns",
    tags: ["api", "pool-liquidity"],
    description: "Get burns on a pair by fetching Burns events",
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema
      }).label("GetBurnsCounts")
    },
    response: {
      schema: outputOkSchema(swapWQTSchema).label("GetBurnsWQTResponse")
    }
  }
}, {
  method: "GET",
  path: "/v1/pool-liquidity/wqt-wbnb/tokenDay",
  handler: getTokenDayData,
  options: {
    auth: false,
    id: "v1.liquidity.wqt-wbnb.getTokenDayData",
    tags: ["api", "pool-liquidity"],
    description: "Get daily information for DAI",
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema
      }).label("GetTokenDayDataQuery")
    },
    response: {
      schema: outputOkSchema(tokensDayWQTSchema).label("GetTokenDayDataResponse")
    }
  }
}, {
  method: "GET",
  path: "/v1/pool-liquidity/wqtDistribution",
  handler: wqtDistribution,
  options: {
    auth: false,
    id: "v1.liquidity.wqtDistribution",
    tags: ["api", "pool-liquidity"],
    description: "Distribution of the WQT to users",
    response: {
      schema: emptyOkSchema
    }
  }
}];
