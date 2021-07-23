import * as Joi from "joi";
import { ContType } from "../models/Files";

export const fileIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("Id");
const contentTypeSchema = Joi.string().valid(...Object.values(ContType)).example(ContType.pdf).label("ContentType");
const urlSchema = Joi.string().example("http://example.com/v1/getVideo").label("URL");
const mediaHashSchema = Joi.number().min(60).max(60).label("MediaHash");
const isoDateSchema = Joi.string().isoDate().example("2021-05-12T05:24:47.322Z");

const offsetSchema = Joi.number().min(0).default(0).label("Offset");
const limitSchema = Joi.number().min(0).default(10).max(100).label("Limit");




export const fileSchemaInfo = Joi.object({
  idUser: fileIdSchema,
  contentType: contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
}).label("FileScheme");


const filesSchema = Joi.object({
  id: fileIdSchema,
  idUser:fileIdSchema,
  contentType:contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
  createdAt:isoDateSchema,
  updateAt: isoDateSchema
})

export const filesQuerySchema = Joi.object({
  offset: offsetSchema,
  limit: limitSchema,
}).label("FilesQuerySchema");

export const filesOutputSchema = Joi.object({
  count: Joi.number().integer().example(10).label("CountQuests"),
  quests: Joi.array().items(filesSchema).label("QuestsList")
}).label("QuestsOutput");

