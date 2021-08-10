import * as Joi from "joi";
import { idSchema, isoDateSchema } from "./index";

const commentIdSchema = idSchema.label("commentId");
const authorIdSchema = idSchema.label("authorId");
const newsIdSchema = idSchema.label("newsId");
export const textTitleSchema = Joi.string().example("Text...").label("Text");

export const forumNewsCommentSchema = Joi.object({
  id: commentIdSchema,
  authorId: authorIdSchema,
  newsId: newsIdSchema,
  rootCommentId: commentIdSchema,
  text: textTitleSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
}).label("newsForumSchemes");
