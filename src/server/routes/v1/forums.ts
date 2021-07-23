import {
  createComment,
  createNews,
  deleteComment,
  deleteNews, findNewsAll,
  deleteLike, createLikes, updateNewsAndComment
} from "../../api/forums";
import * as Joi from "joi";
import { emptyOkSchema, limitSchema,outputOkSchema, shemaNews } from "../../schemes";
import { fileIdSchema, fileSchemaInfo } from "../../schemes/files";

const idFile = fileIdSchema.label("idNews");


export default [
  {
    method: "POST",
    path: "/create/news",
    handler: createNews,
    options: {
      id: "v1.forum.createNews",
      tags: ["api", "forum"],
      description: "Create new news, the file is not empty, but if sent, the field is filled",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          text: Joi.string().required(),
          file: Joi.array()
        })
      }
    }
  },

  {
    method: "POST",
    path: "/create/comment",
    handler: createComment,
    options: {
      id: "v1.forum.createComment",
      tags: ["api", "forum"],
      description: "Create new comment",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required()
        })
      }
    }
  },


  {
    method: "POST",
    path: "/create/like",
    handler: createLikes,
    options: {
      id: "v1.forum.createLike",
      tags: ["api", "forum"],
      description: "Create like",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: Joi.string().required()
        })
      }
    }
  },


  {
    method: "POST",
    path: "/delete/like",
    handler: deleteLike,
    options: {
      id: "v1.forum.deleteLike",
      tags: ["api", "forum"],
      description: "Delete like",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: Joi.string().required()
        })
      }
    }
  },


  {
    method: "POST",
    path: "/delete/news",
    handler: deleteNews,
    options: {
      id: "v1.forum.deleteNews",
      tags: ["api", "forum"],
      description: "Delete news",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: Joi.string().required()
        })
      }
    }
  },


  {
    method: "POST",
    path: "/delete/comment",
    handler: deleteComment,
    options: {
      id: "v1.forum.comment",
      tags: ["api", "forum"],
      description: "Delete comment",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: Joi.string().required(),
          idComment: Joi.string().required()
        })
      }
    }
  },


  {
    method: "GET",
    path: "/news",
    handler: findNewsAll,
    options: {
      id: "v1.forum.findNewsAll",
      tags: ["api", "forum"],
      description: "Find all news, but if you send the author's id, it will find all his news",
      auth: false,
      validate: {
        query: shemaNews
      }
    }
  },

  {
    method: "POST",
    path: "/update/news/",
    handler: updateNewsAndComment,
    options: {
      id: "v1.forum.updateNewsAndComment",
      tags: ["api", "forum"],
      description: "Update news and comment",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required(),
          file: Joi.array().required()
        })
      }
    }
  }


];
