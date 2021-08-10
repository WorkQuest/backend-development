import * as Joi from "joi";
import {
  sendComment,
  createNews,
  getNews,
  likeNews,
  deleteLikeNews
} from "../../api/forums";
import { idSchema, limitSchema, offsetSchema, outputOkSchema } from "../../schemes";
import { forumLikeNewsSchemes, getForumNewsSchema, textTitleSchema } from "../../schemes/news";
import { forumNewsCommentSchema } from "../../schemes/comments";

const newsIdSchema = idSchema.label('NewsId');
const commentIdSchema = idSchema.label('CommentId');
const likeIdSchema = idSchema.label('likeId')

export default [{
  method: "GET",
  path: "/v1/forum/news",
  handler: getNews,
  options: {
    id: "v1.forum.getNews",
    tags: ["api", "forum"],
    description: "Get news",
    validate: {
      query: Joi.object({
        limit: limitSchema.required(),
        offset: offsetSchema.required()
      }).label("GetNewsQuery")
    },
    response: {
      schema: outputOkSchema(getForumNewsSchema).label("forumNewsSchemaResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/forum/news/create",
  handler: createNews,
  options: {
    id: "v1.forum.news.create",
    tags: ["api", "forum"],
    description: "Create new news",
    validate: {
      payload: Joi.object({
        text: textTitleSchema.required()
      }).label("CreateNewsPayload")
    },
    response: {
      schema: outputOkSchema(getForumNewsSchema).label("forumNewsSchemaResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/forum/news/{newsId}/comment/send",
  handler: sendComment,
  options: {
    id: "v1.forum.sendComment",
    tags: ["api", "forum"],
    description: "Send comment",
    validate: {
      params: Joi.object({
        newsId: newsIdSchema.required(),
      }),
      payload: Joi.object({
        rootCommentId: commentIdSchema.default(null),
        text: textTitleSchema
      }).label("SendCommentPayload")
    },
    response: {
      schema: outputOkSchema(forumNewsCommentSchema).label("forumNewsCommentSchemaResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/forum/news/{newsId}/like",
  handler: likeNews,
  options: {
    id: "v1.forum.likeNews",
    tags: ["api", "forum"],
    description: "Like news",
    validate: {
      params: Joi.object({
        newsId: newsIdSchema.required(),
      }).label('LikeNewsParams'),
    },
    response: {
      schema: outputOkSchema(forumLikeNewsSchemes).label("forumLikeNewsSchemesResponse")
    }
  }
}, {
  method: "DELETE",
  path: "/v1/forum/news/{likeId}/like",
  handler: deleteLikeNews,
  options: {
    id: "v1.forum.news.deleteLike",
    tags: ["api", "forum"],
    description: "Delete like",
    validate: {
      params: Joi.object({
        likeId: likeIdSchema.required()
      }).label("DeleteLikeParams")
    },
    response: {
      schema: outputOkSchema(forumLikeNewsSchemes).label("forumLikeNewsSchemesResponse")
    }
  }
}];
