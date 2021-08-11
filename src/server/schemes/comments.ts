import * as Joi from "joi";
import { idSchema, isoDateSchema } from "./index";

const commentIdSchema = idSchema.label("commentId");
const authorIdSchema = idSchema.label("authorId");
const newsIdSchema = idSchema.label("newsId");
const likeIdSchema = idSchema.label("likeCommentId");
export const textTitleSchema = Joi.string().example("Text...").label("Text");
export const commentIdOrNullSchema = Joi.alternatives().try(Joi.string().uuid(), Joi.string().default(null)).label("IdOrNull");

export const forumNewsCommentSchema = Joi.object({
  id: commentIdSchema,
  authorId: authorIdSchema,
  newsId: newsIdSchema,
  rootCommentId: commentIdSchema,
  text: textTitleSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
}).label("newsForumSchema");

export const forumLikeCommentSchemes = Joi.object({
  id: likeIdSchema,
  commentId: commentIdSchema,
  userId: authorIdSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
}).label("likeCommentSchema");
