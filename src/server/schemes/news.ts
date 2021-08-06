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
  text: Joi.string().required().label('Name news')
}).label("createNews");

export const createCommentSchemes= Joi.object({
  idAuthor: idSchema,
  idNews: idSchema,
  idAnswer: Joi.string().default(null).label('Comment to the news and to another comment,' +
    'if the value is null, then to the news, if ID, then comment'),
  text: Joi.string().required().label('comment message')
}).label("createComment");

export const deleteNewsSchemes= Joi.object({
  id: idSchema
}).label("deleteNews");

export const deleteCommentSchemes= Joi.object({
  id: idSchema
}).label("deleteComment");

export  const schemesNews = Joi.object({
  limit: Joi.number().default(100),
  offset: Joi.number().default(0),
  id: Joi.string().default('0')
}).label("findNewsAll");

export const changeNewsAndCommentSchemes= Joi.object({
  id: idSchema,
  idMedia:idSchema,
  text: Joi.string().required().label('Update name news')
}).label("changeNewsAndComment");

export const fileSchemaInfo = Joi.object({
  contentType: contentTypeSchema,
  url: urlSchema,
  hash: mediaHashSchema,
  idComment: Joi.string().default(null).label('File comment or news'),
  idNews: urlSchema
}).label("createFile");

export const filesQuerySchema = Joi.object({
  offset: offsetSchema,
  limit: limitSchema,
}).label("getFiles");


