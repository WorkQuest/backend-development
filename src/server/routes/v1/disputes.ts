import * as Joi from "joi";
import {
  outputOkSchema,
  idSchema,
  problemDescriptionSchema,
  disputeSchema,
  disputesQuerySchema,
  outputPaginationSchema, disputeReasonSchema
} from "@workquest/database-models/lib/schemes";
import { createDispute, getDisputeInfo, getDisputes, } from "../../api/disputes";

 export default [{
   method: "POST",
   path: "/v1/dispute/{questId}/create",
   handler: createDispute,
   options: {
     id: "v1.dispute.create",
     auth: 'jwt-access',
     tags: ["api", "disputes"],
     description: "Create dispute",
     validate: {
       params: Joi.object({
         questId: idSchema.required(),
       }).label("QuestParams"),
       payload: Joi.object({
         reason: disputeReasonSchema.required(),
         problem: problemDescriptionSchema.required(),
       }).label("CreateDisputePayload")
     },
     response: {
       schema: outputOkSchema(disputeSchema).label("TokensWithStatusResponse")
     }
   }
 }, {
   method: "GET",
   path: "/v1/{disputeId}/getDispute",
   handler: getDisputeInfo,
   options: {
     id: "v1.dispute.information",
     auth: 'jwt-access',
     tags: ["api", "disputes"],
     description: "Get info about dispute",
     validate: {
       params: Joi.object({
         disputeId: idSchema.required(),
       }).label("GetDisputeParams"),
     },
     response: {
       schema: outputOkSchema(disputeSchema).label('DisputeInfoResponse')
     }
   }
 }, {
   method: "GET",
   path: "/v1/disputes",
   handler: getDisputes,
   options: {
     id: "v1.disputes.information",
     auth: 'jwt-access',
     tags: ["api", "disputes"],
     description: "Get info about disputes",
     validate: {
       query: disputesQuerySchema.label('QuerySchema')
     },
     response: {
       schema: outputPaginationSchema('disputesList', disputeSchema).label('QuestsListResponse')
     }
   }
 }]

