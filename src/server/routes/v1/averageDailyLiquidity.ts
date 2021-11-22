import Joi = require("joi");
import {
  emptyOkSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema
} from "@workquest/database-models/lib/schemes";
import { apyAllPairs } from "../../../dailyLiquidity/src/averageDailyLiquidity";

export default [{
  method: 'GET',
  path: '/v1/liquidity',
  handler: apyAllPairs,
  options: {
    auth: false,
    id: 'v1.daily.liquidity',
    tags: ['api', 'liquidity'],
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetDailyLiquidity'),
    },
    response: {
      schema: emptyOkSchema
    },
  }
}];
