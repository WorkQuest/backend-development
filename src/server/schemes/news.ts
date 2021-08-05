import * as Joi from "joi";
import { idSchema, limitSchema, offsetSchema, urlSchema } from "./index";
import { contentTypeSchema, mediaHashSchema } from "./media";


export const createLikeSchemes= Joi.object({
  idNews: idSchema,
}).label("like");

export const deleteLikeSchemes= Joi.object({
  id: idSchema,
}).label("deleteLike");

export const createNewsSchemes= Joi.object({
  text: Joi.string().required().label('Name news'),
  file: Joi.array().label('File info')
}).label("createNews");

export const createCommentSchemes= Joi.object({
  idNews: idSchema,
  text: Joi.string().required().label('comment message'),
}).label("createComment");

export const deleteNewsSchemes= Joi.object({
  id: idSchema
}).label("deleteNews");

export const deleteCommentSchemes= Joi.object({
  id: idSchema,
  idComment: idSchema
}).label("deleteComment");

export  const schemesNews = Joi.object({
  limit: Joi.number().default(100),
  offset: Joi.number().default(0),
  id: Joi.string().default('0')
}).label("findNewsAll");

export const changeNewsAndCommentSchemes= Joi.object({
  id: idSchema,
  text: Joi.string().required().label('Update name news'),
  file: Joi.array().label('Update file info')
}).label("changeNewsAndComment");

export const fileSchemaInfo = Joi.object({
  userId: idSchema,
  contentType: contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
}).label("createFile");

export const filesQuerySchema = Joi.object({
  offset: offsetSchema,
  limit: limitSchema,
}).label("getFiles");


