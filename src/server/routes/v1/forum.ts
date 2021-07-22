import {
  createComment,
  createNews,
  deleteComment,
  deleteNews, findNewsAll, findNewsComments,
  userInformation,
  deleteLike, createLikes
} from "../../api/forum";
import * as Joi from "@hapi/joi";
import { limitSchema } from "../../schemes";


export default [
  {
    method: 'POST',
    path: '/create/news',
    handler: createNews,
    options: {
      auth: 'jwt-access',
      validate: {
        payload: Joi.object({
          text: Joi.string().required()
        })
      }
    }
  },


  {
    method: 'POST',
    path: '/creat/comment',
    handler: createComment,
    options: {
      auth: 'jwt-access',
      validate: {
        payload: Joi.object({
          idNews: Joi.string().required(),
          text: Joi.string().required()
        })
      }
    }
  },


  {
    method: 'POST',
    path: '/create/like',
    handler: createLikes,
    options: {
      auth: 'jwt-access',
      validate: {
        payload: Joi.object({
          idNews: Joi.string().required(),
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
    method: 'POST',
    path: '/delete/news',
    handler: deleteNews,
    options: {
      auth: 'jwt-access',
      validate: {
        payload: Joi.object({
          id: Joi.string().required(),
        })
      }
    }
  },


  {
    method: 'POST',
    path: '/delete/comment',
    handler: deleteComment,
    options: {
      auth: 'jwt-access',
      validate: {
        payload: Joi.object({
          idNews: Joi.string().required(),
          idComment: Joi.string().required(),
        })
      }
    }
  },


  {
    method: 'POST',
    path: '/userInformation',
    handler: userInformation,
    options: {
      auth: 'jwt-access',
    }
  },


  {
    method: 'POST',
    path: '/find/commentNews',
    handler: findNewsComments,
    options: {
      auth: 'jwt-access',
      validate: {
        payload: Joi.object({
          id: Joi.string().required(),
        })
      }
    }
  },


  {
    method: 'POST',
    path: '/find/News',
    handler: findNewsAll,
    options: {
      auth: 'jwt-access',
      query: limitSchema
    }
  },


];
