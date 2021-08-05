import * as Joi from "joi";
import { idSchema, urlSchema } from "./index";
import { contentTypeSchema, mediaHashSchema } from "./media";


export const createLikeSchemes= Joi.object({
  idNews: idSchema,
}).label("createLikeSchemes");

export const deleteLikeSchemes= Joi.object({
  id: idSchema,
}).label("deleteLikeSchemes");

export const createNewsSchemes= Joi.object({
  text: Joi.string().required().label('Name news'),
  file: Joi.array().label('File info')
}).label("createNewsSchemes");

export const createCommentSchemes= Joi.object({
  idNews: idSchema,
  text: Joi.string().required().label('comment message'),
}).label("createCommentSchemes");

export const deleteNewsSchemes= Joi.object({
  id: idSchema
}).label("deleteNewsSchemes");

export const deleteCommentSchemes= Joi.object({
  id: idSchema,
  idComment: idSchema
}).label("deleteCommentSchemes");


export const changeNewsAndCommentSchemes= Joi.object({
  id: idSchema,
  text: Joi.string().required().label('Update name news'),
  file: Joi.array().label('Update file info')
}).label("changeNewsAndCommentSchemes");

export const fileSchemaInfo = Joi.object({
  userId: idSchema,
  contentType: contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
}).label("FileScheme");



