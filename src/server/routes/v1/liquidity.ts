import { getSwapsWQT, getTokenDayData } from "../../api/liquidity";
import { outputOkSchema, tokenDayWQTSchema,swapWQTSchema } from "@workquest/database-models/lib/schemes";


export default [
  {
    method: "GET",
    path: "/v1/liquidity/swaps",
    handler: getSwapsWQT,
    options: {
      auth: 'jwt-access',
      id: "v1.auth.getSwaps",
      tags: ["api", "auth", "swaps"],
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
      auth: 'jwt-access',
      id: "v1.auth.getTokenData",
      tags: ["api", "auth", "token"],
      description: "Get daily information for DAI",
      response: {
        schema: outputOkSchema(tokenDayWQTSchema).label("GetSwapsWQTResponse")
      },
    }
  },
]
