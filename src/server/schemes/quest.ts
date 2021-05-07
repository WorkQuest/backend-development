import * as Joi from "joi";
import { Priority, AdType } from "../models/Quest";
import { Column, DataType } from 'sequelize-typescript';

export const userIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("UserId");
export const categorySchema = Joi.string().example('retail').label('Category');
export const prioritySchema = Joi.number().allow(...Object.values(Priority)).example(Priority.AllPriority).label('Priority');
export const addressSchema = Joi.string().example('' /*TODO*/).label('Address');
export const titleSchema = Joi.string().example('Title...').label('Title');
export const descriptionSchema = Joi.string().max(1000).example('Description quest...').label('Description');
export const priceSchema = Joi.number().example(10.12).label('Price'); /*TODO */
export const adTypeSchema = Joi.number().allow(...Object.values(AdType)).example(AdType.Free).label('AdType');

export const createQuest = Joi.object({
  category: categorySchema.required(),
  priority: prioritySchema.required(),
  address: addressSchema.required(),
  title: titleSchema.required(),
  description: descriptionSchema,
  price: priceSchema.required(),
  adType: adTypeSchema,
});
