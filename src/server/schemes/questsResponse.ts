import * as Joi from "joi";
import { QuestsResponseStatus, QuestsResponseType } from  "../models/QuestsResponse"
import { userIdSchema } from "./user";
import { questIdSchema } from "./quest";

export const questsResponseIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("QuestsResponseId");
export const messageSchema = Joi.string().example('Hello, I need this job').default('').label('Message');
export const questsResponseStatusSchema = Joi.number().example(QuestsResponseStatus.Open).valid(...Object.keys(QuestsResponseStatus).map(key => parseInt(key)).filter(key => !isNaN(key))).label('QuestsResponseStatus');
export const questsResponseTypeSchema = Joi.number().example(QuestsResponseType.Response).valid(...Object.keys(QuestsResponseType).map(key => parseInt(key)).filter(key => !isNaN(key))).label('QuestsResponseType');


export const questsResponseSchema = Joi.object({
  workerId: userIdSchema,
  questId: questIdSchema,
  status: questsResponseStatusSchema,
  type: questsResponseTypeSchema,
  message: messageSchema,
}).label('QuestsResponseSchema');
