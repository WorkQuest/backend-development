import * as Joi from "joi";
import { idSchema, isoDateSchema } from './index';

const reviewIdSchema = idSchema.label('ReviewId');
const questIdSchema = idSchema.label('QuestId');
const fromUserIdSchema = idSchema.label('FromUserId');
const toUserIdSchema = idSchema.label('ToUserId');

export const messageSchema = Joi.string().example('Hello, I need this job').default('').label('Message');
export const markSchema = Joi.number().min(1).max(5).label('Mark');

export const reviewSchema = Joi.object({
  reviewId: reviewIdSchema,
  questId: questIdSchema,
  fromUserId: fromUserIdSchema,
  toUserId: toUserIdSchema,
  message: messageSchema,
  mark: markSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
}).label('ReviewSchema');
