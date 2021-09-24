import { getBurns, getMints, getSwaps, getTokenDayData } from "../../api/liquidityPool(wqt-weth)";
import {
  outputOkSchema,
  tokensDayWQTSchema,
  swapWQTSchema,
  offsetSchema, limitSchema
} from "@workquest/database-models/lib/schemes";
import * as Joi from "joi";

export default [{
  method: "GET",
  path: "/v1/pool-liquidity/wqt-weth/swaps",
  handler: getSwaps,
  options: {
    id: "v1.liquidity.wqt-weth.getSwaps",
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
  path: "/v1/pool-liquidity/wqt-weth/mints",
  handler: getMints,
  options: {
    id: "v1.liquidity.wqt-weth.getMints",
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
  path: "/v1/pool-liquidity/wqt-weth/burns",
  handler: getBurns,
  options: {
    id: "v1.liquidity.wqt-weth.getSBurns",
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
  path: "/v1/pool-liquidity/wqt-weth/tokenDay",
  handler: getTokenDayData,
  options: {
    id: "v1.liquidity.wqt-weth.getTokenDayData",
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
}];