import * as Joi from "joi";
import { getLiquidity } from "../../../dailyLiquidity/src/api/dailyLiquidity";
import {
  idSchema, limitSchema, offsetSchema,
  outputOkSchema, outputPaginationSchema, questsResponseMessageSchema
} from "@workquest/database-models/lib/schemes";
import { dailyLiquiditySchema } from "@workquest/database-models/lib/schemes/dailyLiquidity";

export default [ {
  method: "GET",
  path: "/v1/dailyLiquidity",
  handler: getLiquidity,
  options: {
    auth: false,
    id: "v1.dailyLiquidity",
    tags: ["api", "dailyLiquidity"],
    description: "Get daily liquidity",
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label("DailyLiquidityQuery"),
    },
    response: {
      schema: outputPaginationSchema('dailyLiquidity',dailyLiquiditySchema).label("GetDailyLiquidityResponse")
    }
  }
}];
