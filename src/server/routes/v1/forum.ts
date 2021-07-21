import {
  createComment,
  createNews,
  deleteComment,
  deleteNews, findNewsAll, findNewsComments,
  findUserInfo, likeDelete,
  likesCreate
} from "../../api/forum";
import * as Joi from '@hapi/joi';
import {limitSchema} from "../../schemes";


export default [
  {
    method: 'POST',
    path: '/create/news',
    handler: createNews,
    options: {
      auth: 'jwt-access',
      validate: {
        payload: Joi.object({
          idAuthor: Joi.string().required(),
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
          idAuthor: Joi.string().required(),
          text: Joi.string().required()
        })
      }
    }
  },


  {
    method: 'POST',
    path: '/like/create',
    handler: likesCreate,
    options: {
      auth: 'jwt-access',
      validate: {
        payload: Joi.object({
          idNews: Joi.string().required(),
          idUser: Joi.string().required()
        })
      }
    }
  },


  {
    method: 'POST',
    path: '/like/delete',
    handler: likeDelete,
    options: {
      auth: 'jwt-access',
      validate: {
        payload: Joi.object({
          id: Joi.string().required(),
          idUser: Joi.string().required()
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
          id: Joi.string().required(),
        })
      }
    }
  },


  {
    method: 'POST',
    path: '/find/user',
    handler: findUserInfo,
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
    path: '/find/commentNews',
    handler: findNewsComments,
    options: {
      auth: false,
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
      auth: false,
      query: limitSchema
    }
  },


];
