import * as Joi from "joi";
import { idSchema, isoDateSchema } from "./index";
import { mediaIdsSchema } from "./media";

const newsIdSchema = idSchema.label("newsId");
const authorIdSchema = idSchema.label("authorId");
const likeNewsIdSchemes = idSchema.label("QuestId");
export const textTitleSchema = Joi.string().example("Text...").label("Text");

export const getForumNewsSchema = Joi.object({
  id: newsIdSchema,
  authorId: authorIdSchema,
  text: textTitleSchema,
  newsMedia: mediaIdsSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
}).label("newsForumSchemes");

export const forumLikeNewsSchemes = Joi.object({
  id: likeNewsIdSchemes,
  newsId: newsIdSchema,
  userId: authorIdSchema
});
