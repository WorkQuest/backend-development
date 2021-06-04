import * as Joi from "joi";
import {
  idSchema,
  isoDateSchema,
  limitSchema,
  locationSchema,
  offsetSchema,
  searchSchema,
  sortDirectionSchema
} from './index';
import { QuestPriority, AdType, QuestStatus } from '../models/Quest';
import { userSchema } from './user';

const userIdSchema = idSchema.label('UserId');
const questIdSchema = idSchema.label('QuestId');
export const categorySchema = Joi.string().example('Retail').label('Category');
export const questStatusSchema = Joi.number().valid(...Object.keys(QuestStatus).map(key => parseInt(key)).filter(key => !isNaN(key))).example(QuestStatus.Created).default(QuestStatus.Created).label('Status');
export const questPrioritySchema = Joi.number().valid(...Object.keys(QuestPriority).map(key => parseInt(key)).filter(key => !isNaN(key))).example(QuestPriority.AllPriority).label('Priority');
export const titleSchema = Joi.string().example('Title...').label('Title');
export const descriptionSchema = Joi.string().example('Description quest...').label('Description');
export const priceSchema = Joi.string().example("500").label('Price');
export const adTypeSchema = Joi.number().valid(...Object.keys(AdType).map(key => parseInt(key)).filter(key => !isNaN(key))).example(AdType.Free).default(AdType.Free).label('AdType');

export const questSchema = Joi.object({
  id: questIdSchema,
  userId: userIdSchema,
  category: categorySchema,
  status: questStatusSchema,
  priority: questPrioritySchema,
  location: locationSchema,
  title: titleSchema,
  description: descriptionSchema,
  price: priceSchema,
  adType: adTypeSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
}).label("QuestSchema");

export const questFullSchema = Joi.object({
  id: questIdSchema,
  userId: userIdSchema,
  category: categorySchema,
  status: questStatusSchema,
  priority: questPrioritySchema,
  location: locationSchema,
  title: titleSchema,
  description: descriptionSchema,
  price: priceSchema,
  adType: adTypeSchema,
  user: userSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
}).label("QuestFullSchema");

export const questsListSortSchema = Joi.object({
  price: sortDirectionSchema,
  createdAt: sortDirectionSchema,
}).default({}).label('QuestsListSortSchema');

export const questsQuerySchema = Joi.object({
  offset: offsetSchema,
  limit: limitSchema,
  q: searchSchema,
  priority: questPrioritySchema.default(null),
  status: questStatusSchema.default(null),
  sort: questsListSortSchema,
}).label('QuestsQueryScheme');

