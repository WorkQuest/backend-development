import * as Joi from "joi";
import { ContentType } from '../models/Media';
import { urlSchema } from './index';
import { userIdSchema } from './user';

export const mediaIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("MediaId");
export const contentTypeSchema = Joi.string().valid(...Object.values(ContentType)).example(ContentType.png).label('ContentType');
export const mediaHashSchema = Joi.number().min(60).max(60).label('MediaHash') // TODO: add example

export const mediaSchema = Joi.object({
  id: mediaIdSchema,
  userId: userIdSchema,
  contentType: contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
}).label('MediaScheme');
