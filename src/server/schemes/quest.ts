import * as Joi from "joi";
import { Priority, AdType } from "../models/Quest";
import { isoDateSchema, locationSchema } from './index';

export const questIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("QuestId");
export const userIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("UserId");
export const categorySchema = Joi.string().example('Retail').label('Category');
export const prioritySchema = Joi.number().valid(...Object.values(Priority)).example(Priority.AllPriority).label('Priority');
export const titleSchema = Joi.string().example('Title...').label('Title');
export const descriptionSchema = Joi.string().example('Description quest...').label('Description');
export const priceSchema = Joi.string().example("500").label('Price');
export const adTypeSchema = Joi.number().valid(...Object.values(AdType)).example(AdType.Free).label('AdType');

export const questSchema = Joi.object({
  userId: userIdSchema,
  category: categorySchema,
  priority: prioritySchema,
  location: locationSchema,
  title: titleSchema,
  description: descriptionSchema,
  price: priceSchema,
  adType: adTypeSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
}).label("QuestSchema");
