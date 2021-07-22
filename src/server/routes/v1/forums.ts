import {
  createComment,
  createNews,
  deleteComment,
  deleteNews, findNewsAll,
  deleteLike, createLikes, updateNewsAndComment
} from "../../api/forums";
import * as Joi from "@hapi/joi";
import { emptyOkSchema, limitSchema, offsetLimit, outputOkSchema } from "../../schemes";
import { fileIdSchema, fileSchemaInfo } from "../../schemes/files";

const idFile = fileIdSchema.label("idNews");


export default [
  {
    method: "POST",
    path: "/create/news",
    handler: createNews,
    options: {
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          text: Joi.string().required()
        })
      }
    }
  },


  {
    method: "POST",
    path: "/create/comment",
    handler: createComment,
    options: {
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          idNews: Joi.string().required(),
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
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          idNews: Joi.string().required()
        })
      }
    }
  },


  {
    method: "POST",
    path: "/delete/like",
    handler: deleteLike,
    options: {
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
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          idNews: Joi.string().required(),
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
      auth: false,
      validate: {
        query: offsetLimit
      }
    }
  },

  {
    method: "POST",
    path: "/update/news",
    handler: updateNewsAndComment,
    options: {
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          idNews: Joi.string().required(),
          text: Joi.string().required()
        })
      }
    }
  },





];
