import * as Joi from "joi";
import { ContType } from "../models/Files";

export const fileIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("Id");
const newsIdOnlySchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("idNews");
const contentTypeSchema = Joi.string().valid(...Object.values(ContType)).example(ContType.pdf).label("ContentType");
const urlSchema = Joi.string().example("http://example.com/v1/getVideo").label("URL");
const mediaHashSchema = Joi.number().min(60).max(60).label("MediaHash");


export const fileSchemaInfo = Joi.object({
  idNews: newsIdOnlySchema,
  contentType: contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
}).label('FileScheme');


