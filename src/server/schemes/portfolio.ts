import * as Joi from "joi";
import { idSchema, isoDateSchema } from './index';
import { mediasUrlOnlySchema } from './media';

const portfolioIdSchema = idSchema.label('PortfolioId');
export const titleSchema = Joi.string().example('Title...').label('Title');
export const descriptionSchema = Joi.string().example('Description..').label('Description');

export const portfolioSchema = Joi.object({
  id: portfolioIdSchema,
  title: titleSchema,
  description: descriptionSchema,
  medias: mediasUrlOnlySchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
}).label('Portfolio');
