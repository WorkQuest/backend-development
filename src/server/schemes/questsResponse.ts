import * as Joi from "joi";
import { idSchema } from './index';
import { QuestsResponseStatus, QuestsResponseType } from  "../models/QuestsResponse"

export const messageSchema = Joi.string().example('Hello, I need this job').default('').label('Message');
export const questsResponseStatusSchema = Joi.number().example(QuestsResponseStatus.Open).valid(...Object.keys(QuestsResponseStatus).map(key => parseInt(key)).filter(key => !isNaN(key))).label('QuestsResponseStatus');
export const questsResponseTypeSchema = Joi.number().example(QuestsResponseType.Response).valid(...Object.keys(QuestsResponseType).map(key => parseInt(key)).filter(key => !isNaN(key))).label('QuestsResponseType');

export const questsResponseSchema = Joi.object({
  id: idSchema.label('QuestsResponseId'),
  workerId: idSchema.label('WorkerId'),
  questId: idSchema.label('QuestId'),
  status: questsResponseStatusSchema,
  type: questsResponseTypeSchema,
  message: messageSchema,
}).label('QuestsResponseSchema');

export const questsResponsesSchema = Joi.array().items(questsResponseSchema).label('QuestsResponsesSchema');


