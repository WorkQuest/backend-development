import * as Joi from "joi";
import { ContType } from "../models/Files";
import { QuestPriority, QuestStatus } from '../models/Quest';

export const fileIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("Id");
const contentTypeSchema = Joi.string().valid(...Object.values(ContType)).example(ContType.pdf).label("ContentType");
const urlSchema = Joi.string().example("http://example.com/v1/getVideo").label("URL");
const mediaHashSchema = Joi.number().min(60).max(60).label("MediaHash");


export const fileSchemaInfo = Joi.object({
  idUser: fileIdSchema,
  contentType: contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
}).label('FileScheme');


const offsetSchema = Joi.number().min(0).default(0).label("Offset");
const limitSchema = Joi.number().min(0).default(10).max(100).label('Limit');
const searchSchema = Joi.string().default(null).max(255).label('Search');
const questPrioritySchema = Joi.number().valid(...Object.keys(QuestPriority).map(key => parseInt(key)).filter(key => !isNaN(key))).example(QuestPriority.AllPriority).label('Priority');
const questStatusSchema = Joi.number().valid(...Object.keys(QuestStatus).map(key => parseInt(key)).filter(key => !isNaN(key))).example(QuestStatus.Created).label('Status');

export const filesQuerySchema = Joi.object({
  offset: offsetSchema,
  limit: limitSchema,
  q: searchSchema,
  priority: questPrioritySchema.default(null),
  status: questStatusSchema.default(null),
  invited: Joi.boolean().default(false),
  performing: Joi.boolean().default(false),
  starred: Joi.boolean().default(false),
}).label('QuestsQueryScheme');

