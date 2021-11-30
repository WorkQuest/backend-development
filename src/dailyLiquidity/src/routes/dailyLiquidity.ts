import Joi = require("joi");
import {
  emptyOkSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema
} from "@workquest/database-models/lib/schemes";
import { apyAllPairs, getLiquidity } from "../api/dailyLiquidity";
import { dailyLiquiditySchema } from "@workquest/database-models/lib/schemes/dailyLiquidity";

export default [{
  method: 'GET',
  path: '/v1/liquidity/wqt-bnb',
  handler: getLiquidity,
  options: {
    auth: false,
    id: 'v1.daily.liquidity',
    description: "Get liquidity per 10 days",
    tags: ['api', 'liquidity'],
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetDailyLiquidity'),
    },
    response: {
      schema: outputOkSchema(dailyLiquiditySchema).label('DailyLiquidityResponse')
    },
  }
}];
