import * as Joi from "joi";
import { getBurns, getMints, getSwaps, getTokenDayData, getDistribution } from "../../api/liquidityPool(wqt-wbnb)";
import {
  limitSchema,
  offsetSchema,
  swapWQTSchema,
  outputOkSchema,
  tokensDayWQTSchema,
  contractAmountSchema,
} from '@workquest/database-models/lib/schemes';
import { dailyLiquiditySchema } from "@workquest/database-models/lib/schemes/dailyLiquidity";

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
      schema: outputOkSchema(dailyLiquiditySchema).label("GetTokenDayDataResponse")
    }
  }
}, {
  method: "GET",
  path: "/v1/pool-liquidity/wqt-wbnb/distribution",
  handler: getDistribution,
  options: {
    auth: false,
    id: "v1.liquidity.wqt-wbnb.getDistribution",
    tags: ["api", "pool-liquidity"],
    description: "Distribution of the WQT to users",
    response: {
      schema: outputOkSchema(contractAmountSchema).label("GetTokenDayDataResponse")
    }
  }
}];
