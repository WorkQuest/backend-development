import * as Joi from "joi";
import { applicantReviewed, createAccessToken } from "../../api/sumsub";
import { outputOkSchema } from "../../schemes";

export default [{
  method: "GET",
  path: "/v1/sumsub/createAccessToken",
  handler: createAccessToken,
  options: {
    id: "v1.sumsub.createAccessToken",
    tags: ["api", "sumsub"],
    description: "Create access token in SumSub",
    response: {
      schema: outputOkSchema(Joi.object({
        token: Joi.string().example("_act-681cdf47-c418-4cba-8207-3c3415a3a14c").label("SumSubAccessToken"),
        userId: Joi.string().example("e6685019-e42a-40ed-9327-58e3de849c3c").label("SumSubUserId")
      }).label("CreateAccessTokenResult")).label("CreateAccessTokenResponse")
    }
  },
}, {
  method: "POST",
  path: "/v1/sumsub/applicantReviewed",
  handler: applicantReviewed,
  options: {
    auth: false,
    id: "v1.sumsub.applicantReviewed",
    tags: ["sumsub"],
    description: "Applicant reviewed on SumSub [PRIVATE WEBHOOK]",
    payload: {
      output: "data",
      parse: false
    }
  },
}];
