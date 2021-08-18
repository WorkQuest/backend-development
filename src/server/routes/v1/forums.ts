import * as Joi from "joi";
import {
  sendComment,
  createNews,
  getNews,
  likeNews,
  deleteLikeNews,
  likeComment,
  deleteLikeComment,
  getNewsComments
} from "../../api/forums";
import {
  emptyOkSchema,
  idSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema
} from "@workquest/database-models/lib/schemes";
import {
  getForumNewsSchema,
  textTitleSchema
} from "@workquest/database-models/lib/schemes/news";
import { commentIdOrNullSchema, forumNewsCommentSchema } from "@workquest/database-models/lib/schemes/comment";
import { mediaIdsSchema } from "@workquest/database-models/lib/schemes/media";
import { comments } from "@workquest/database-models/src/schemes/news";

const newsIdSchema = idSchema.label("NewsId");
const commentIdSchema = idSchema.label("CommentId");

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
    id: "v1.forum.createNews",
    tags: ["api", "forum"],
    description: "Create new news",
    validate: {
      payload: Joi.object({
        text: textTitleSchema.required(),
        medias: mediaIdsSchema.default([]).unique().label("MediaIds")
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
    id: "v1.forum.news.sendComment",
    tags: ["api", "forum"],
    description: "Send comment",
    validate: {
      params: Joi.object({
        newsId: newsIdSchema.required()
      }),
      payload: Joi.object({
        rootCommentId: commentIdOrNullSchema,
        text: textTitleSchema.required()
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
    id: "v1.forum.news.likeNews",
    tags: ["api", "forum"],
    description: "Like news",
    validate: {
      params: Joi.object({
        newsId: newsIdSchema.required()
      }).label("LikeNewsParams")
    },
    response: {
      schema: emptyOkSchema
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
        newsId: newsIdSchema.required()
      }).label("DeleteLikeParams")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/forum/comment/{commentId}/like",
  handler: likeComment,
  options: {
    id: "v1.forum.news.comment.likeComment",
    tags: ["api", "forum"],
    description: "Like comment",
    validate: {
      params: Joi.object({
        commentId: commentIdSchema.required()
      }).label("LikeCommentParams")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/forum/comment/{likeCommentId}/like",
  handler: deleteLikeComment,
  options: {
    id: "v1.forum.news.comment.deleteLike",
    tags: ["api", "forum"],
    description: "Delete like in comment",
    validate: {
      params: Joi.object({
        commentId: commentIdSchema.required()
      }).label("DeleteLikeCommentParams")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "GET",
  path: "/v1/forum/news/{newsId}/comments",
  handler: getNewsComments,
  options: {
    id: "v1.forum.news.getComments",
    tags: ["api", "forum"],
    description: "Get comments on news",
    validate: {
      params: Joi.object({
        newsId: newsIdSchema
      }).label("EmployerForumParams"),
      query: Joi.object({
        limit: limitSchema.required(),
        offset: offsetSchema.required()
      }).label("GetNewsCommentsQuery")
    },
    response: {
      schema: outputOkSchema(comments).label("ForumNewsCommentsSchemesResponse")
    }
  }
}];

