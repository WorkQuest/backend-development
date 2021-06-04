import * as Joi from "joi";
import { ContentType } from '../models/Media';
import { idSchema, urlSchema } from './index';

const mediaIdSchema = idSchema.label("MediaId");
const userIdSchema = idSchema.label("UserId");
export const contentTypeSchema = Joi.string().valid(...Object.values(ContentType)).example(ContentType.png).label('ContentType');
export const mediaHashSchema = Joi.number().min(60).max(60).label('MediaHash') // TODO: add example

export const mediaUrlOnlySchema = Joi.object({
  id: mediaIdSchema,
  url: urlSchema,
}).label('MediaUrlOnlyScheme');

export const mediaSchema = Joi.object({
  id: mediaIdSchema,
  userId: userIdSchema,
  contentType: contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
}).label('MediaScheme');
