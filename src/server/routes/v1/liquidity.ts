import { getSwapsWQT, getTokenDayData } from "../../api/liquidity";
import { outputOkSchema, tokenDayWQTSchema, swapWQTSchema } from "@workquest/database-models/lib/schemes";

export default [{
  method: "GET",
  path: "/v1/liquidity/swaps",
  handler: getSwapsWQT,
  options: {
    id: "v1.liquidity.getSwapsWQT",
    tags: ["api", "swaps"],
    description: "Get the last 100 swaps on a pair by fetching Swap events",
    response: {
      schema: outputOkSchema(swapWQTSchema).label("GetSwapsWQTResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/liquidity/tokenDay",
  handler: getTokenDayData,
  options: {
    id: "v1.liquidity.getTokenDayData",
    tags: ["api", "token"],
    description: "Get daily information for DAI",
    response: {
      schema: outputOkSchema(tokenDayWQTSchema).label("GetTokenDayDataResponse")
    },
  }
}]
