import * as Joi from "joi";
import { ContentType } from "../models/Media";
import { idSchema, urlSchema } from "./index";

const mediaIdSchema = idSchema.label("MediaId");
export const contentTypeSchema = Joi.string().valid(...Object.values(ContentType)).example(ContentType.png).label("ContentType");
export const mediaHashSchema = Joi.number().min(60).max(60).label("MediaHash");

export const mediaUrlOnlySchema = Joi.object({
  id: mediaIdSchema,
  url: urlSchema
}).label("MediaUrlOnlyScheme");

export const mediaSchema = Joi.object({
  id: mediaIdSchema,
  userId: idSchema.label("UserId"),
  contentType: contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
}).label('MediaScheme');

export const mediaIdsSchema = Joi.array().items(mediaIdSchema).label("MediaIdsArray");
export const mediasUrlOnlySchema = Joi.array().items(mediaUrlOnlySchema).label('MediasUrlOnlyScheme');
