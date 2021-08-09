import * as Joi from "joi";
import {
  createComment, createNews, createFile, getFiles, getNews, putLike, deleteLike
} from "../../api/forums";
import { idSchema, limitSchema, offsetSchema, urlSchema } from "../../schemes";
import { contentTypeSchema, mediaHashSchema } from "../../schemes/media";

export default [
  {
    method: "POST",
    path: "/v1/forum/news/create",
    handler: createNews,
    options: {
      id: "v1.forum.news.create",
      tags: ["api", "forum", "news"],
      description: "Create new news, the file is not empty, but if sent, the field is filled",
      validate: {
        payload: Joi.object({
          text: Joi.string().required().label("NameNews")
        }).label("createNews")
      }
    }
  },
  {
    method: "POST",
    path: "/v1/forum/comment/create",
    handler: createComment,
    options: {
      id: "v1.forum.createComment",
      tags: ["api", "forum"],
      description: "Create new comment",
      validate: {
        payload: Joi.object({
          idNews: idSchema,
          idAnswer: Joi.string().default(null).label("HeadCommentOrAnswer"),
          text: Joi.string().required().label("TextMessage")
        }).label("createComment")
      }
    }
  },
  {
    method: "POST",
    path: "/v1/forum/{idNews}/like/create",
    handler: putLike,
    options: {
      id: "v1.forum.putLike",
      tags: ["api", "forum", "like"],
      description: "Create like",
      validate: {
        payload: Joi.object({
          idNews: idSchema.required()
        }).label("putLike")
      }
    }
  },
  {
    method: "POST",
    path: "/v1/forum/{idLike}/delete",
    handler: deleteLike,
    options: {
      id: "v1.forum.deleteLike",
      tags: ["api", "forum", "like"],
      description: "Delete like",
      validate: {
        payload: Joi.object({
          id: idSchema.required()
        }).label("deleteLike")
      }
    }
  },
  {
    method: "GET",
    path: "/v1/forum/getNews",
    handler: getNews,
    options: {
      id: "v1.forum.findNewsAll",
      tags: ["api", "forum"],
      description: "Find all news, but if you send the author's id, it will find all his news",
      auth: false,
      validate: {
        query: Joi.object({
          limit: limitSchema.required(),
          offset: offsetSchema.required()
        }).label("getNews")
      }
    }
  },
  {
    method: "POST",
    path: "/v1/forum/file/create",
    handler: createFile,
    options: {
      id: "v1.create.file",
      description: `Register new file`,
      tags: ["api", "file"],
      validate: {
        payload: Joi.object({
          contentType: contentTypeSchema,
          url: urlSchema,
          hash: mediaHashSchema,
          idComment: Joi.string().default(null).label("File comment or news"),
          idNews: idSchema.required()
        }).label("createFile")
      }
    }
  },
  {
    method: "GET",
    path: "/v1/forum/getFiles",
    handler: getFiles,
    options: {
      id: "v1.files",
      tags: ["api", "file"],
      description: "Get all files",
      validate: {
        query: Joi.object({
          offset: offsetSchema.required(),
          limit: limitSchema.required()
        }).label("getFiles")
      }
    }
  }
];
