import * as Joi from "joi";
import {
  sendComment,
  createNews,
  getNews,
  likeNews,
  deleteLikeNews
} from "../../api/forums";
import { idSchema, limitSchema, offsetSchema } from "../../schemes";

const newsIdSchema = idSchema.label('NewsId');
const commentIdSchema = idSchema.label('CommentId');

export default [{
  method: "GET",
  path: "/v1/forum/news",
  handler: getNews,
  options: {
    id: "v1.forum.getNews",
    tags: ["api", "forum"],
    description: "Get news",
    validate: {
      query: Joi.object({ // TODO
        limit: limitSchema.default(10),
        offset: offsetSchema.default(0),
      }).label("GetNewsQuery")
    },
    response: {
      // TODO
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
        text: Joi.string().required().label("NameNews") // TODO
      }).label("CreateNewsPayload")
    },
    response: {
      // TODO
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
      payload: Joi.object({ // TODO
        rootCommentId: commentIdSchema.default(null),
        text: Joi.string().required().label("TextMessage")
      }).label("SendCommentPayload")
    },
    response: {
      // TODO
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
        newsId: idSchema.required(),
      }).label('LikeNewsParams'),
    }
  }
}, {
  method: "DELETE",
  path: "/v1/forum/news/{newsId}/like",
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
      // TODO
    }
  }
}];
