import * as Joi from "joi";
import { getLiquidity } from "../../../dailyLiquidity/src/api/dailyLiquidity";
import {
  outputOkSchema,
} from '@workquest/database-models/lib/schemes';
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
    response: {
      schema: outputOkSchema(dailyLiquiditySchema).label("GetDailyLiquidityResponse")
    }
  }
}];
