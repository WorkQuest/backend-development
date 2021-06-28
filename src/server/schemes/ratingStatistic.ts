import * as Joi from 'joi';
import { idSchema } from './index';

const ratingStatisticIdSchema = idSchema.label('RatingStatisticId');
const userIdSchema = idSchema.label('UserId');
export const reviewCountSchema = Joi.number().example(3).label('ReviewCount');
export const averageMarkSchema = Joi.number().example(3.5).label('AverageMark');

export const ratingStatisticSchema = {
  id: ratingStatisticIdSchema,
  userId: userIdSchema,
  reviewCount: reviewCountSchema,
  averageMark: averageMarkSchema,
};
