import * as Joi from "joi";
import {
  outputOkSchema,
  sumsubAccessToken,
  sumsubUserId,
} from "@workquest/database-models/lib/schemes";
import { applicantReviewed, createAccessToken } from "../../api/sumsub";

export default [{
  method: "GET",
  path: "/v1/sumsub/create-access-token",
  handler: createAccessToken,
  options: {
    auth: 'jwt-access',
    id: "v1.sumsub.createAccessToken",
    tags: ["api", "sumsub"],
    description: "Create access token in SumSub",
    response: {
      schema: outputOkSchema(Joi.object({
        token: sumsubAccessToken,
        userId: sumsubUserId,
      }).label("CreateAccessTokenResult")).label("CreateAccessTokenResponse")
    }
  },
}, {
  method: "POST",
  path: "/v1/sumsub/applicant-reviewed",
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
