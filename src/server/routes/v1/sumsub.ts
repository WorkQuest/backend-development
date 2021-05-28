import * as Joi from "joi";
import { createAccessToken } from '../../api/sumsub';

export default [{
  method: "GET",
  path: "/v1/sumsub/createAccessToken",
  handler: createAccessToken,
  options: {
    id: "v1.sumsub.createAccessToken",
    tags: ["api", "sumsub"],
    description: "Create access token in SumSub",
    response: {
      schema: Joi.object({
        token: Joi.string().example('_act-681cdf47-c418-4cba-8207-3c3415a3a14c').label('SumSubAccessToken'),
        userId: Joi.string().example('e6685019-e42a-40ed-9327-58e3de849c3c').label('SumSubUserId')
      }).label('CreateAccessTokenResponse')
    }
  },
}];
