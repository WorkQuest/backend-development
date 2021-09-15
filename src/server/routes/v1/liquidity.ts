import { getSwapsWQT, getTokenDayData } from "../../api/liquidity";
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
  handler: getSwapsWQT,
  options: {
    id: "v1.liquidity.getSwapsWQT",
    tags: ["api", "swaps"],
    description: "Get the last 100 swaps on a pair by fetching Swap events",
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema
      }).label("GetSwapsCounts")
    },
    response: {
      schema: outputOkSchema(swapWQTSchema).label("GetSwapsWQTResponse")
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
      }).label("GetLiquidityToken")
    },
    response: {
      schema: outputOkSchema(tokensDayWQTSchema).label("GetTokenDayDataResponse")
    }
  }
}];
