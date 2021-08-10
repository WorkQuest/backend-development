import * as Joi from "joi";
import {
  outputOkSchema,
  idSchema,
  userLastNameSchema,
  userEmailSchema,
  userPasswordSchema,
  tokensWithStatus,
  problemDescriptionSchema
} from "@workquest/database-models/lib/schemes";
import { createDispute } from "../../api/disputes";

 export default[ {
   method: "POST",
   path: "/v1/dispute/{questId}/create",
   handler: createDispute,
   options: {
     id: "v1.dispute.create",
     tags: ["api", "disputes"],
     description: "Create dispute",
     validate: {
       params: Joi.object({
        questId: idSchema.required(),
       }).label("QuestParams"),
       payload: Joi.object({
         problem: problemDescriptionSchema.required(),
       }).label("CreateDisputePayload")
     },
     response: {
       schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
     }
   }
 },//{
//   method: "GET",
//   path: "/v1/disputes/{questId}",
//   handler: getDisputes,
//   options: {
//     id: "v1.disputes.info",
//     tags: ["api", "disputes"],
//     description: "Get info about disputes",
//     validate: {
//       params: Joi.object({
//         questId: idSchema.required(),
//       }).label("GetQuestParams"),
//     },
//     response: {
//       schema: outputOkSchema(disputeSchema).label('DisputeInfoResponse')
//     }
//   }
// },
  ]

