import * as Joi from "joi";
import { userIdSchema } from "./user";
import { questIdSchema } from "./quest";

export const questsResponseIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("QuestsResponseId");
export const messageSchema = Joi.string().example('Hello, I need this job').label('Message');

export const questsResponseSchema = Joi.object({
  userId: userIdSchema,
  questId: questIdSchema,
  message: messageSchema,
}).label('QuestsResponseSchema')
