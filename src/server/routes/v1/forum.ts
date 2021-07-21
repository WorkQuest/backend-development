import {
  creatCommentForum,
  creatNewsForum,
  deleteComment,
  deleteNews,
  findUserInfo,
  likesCreate
} from "../../api/forum";
import * as Joi from '@hapi/joi';

export default [
  {
    method: 'POST',
    path: '/create/news',
    handler: creatNewsForum,
    options: {
      auth: false,
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
    handler: creatCommentForum,
    options: {
      auth: false,
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
      auth: false,
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
    path: '/delete/comment',
    handler: deleteComment,
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
    path: '/find/user',
    handler: findUserInfo,
    options: {
      auth: false,
      validate: {
        payload: Joi.object({
          id: Joi.string().required(),
        })
      }
    }
  },


];
