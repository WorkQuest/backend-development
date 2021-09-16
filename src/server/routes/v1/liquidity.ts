import { getBurns, getMints, getSwaps, getTokenDayData } from "../../api/liquidity";
import {
  outputOkSchema,
  tokensDayWQTSchema,
  swapWQTSchema,
  offsetSchema, limitSchema
} from "@workquest/database-models/lib/schemes";
import * as Joi from "joi";

export default [{
  method: "GET",
  path: "/v1/liquidity/swaps",
  handler: getSwaps,
  options: {
    id: "v1.liquidity.getSwaps",
    tags: ["api", "swaps"],
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
  path: "/v1/liquidity/mints",
  handler: getMints,
  options: {
    id: "v1.liquidity.getMints",
    tags: ["api", "mints"],
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
  path: "/v1/liquidity/burns",
  handler: getBurns,
  options: {
    id: "v1.liquidity.getSBurns",
    tags: ["api", "burns"],
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
  path: "/v1/liquidity/tokenDay",
  handler: getTokenDayData,
  options: {
    id: "v1.liquidity.getTokenDayData",
    tags: ["api", "token"],
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
