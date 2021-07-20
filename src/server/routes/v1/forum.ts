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
      // validate: {
      //   payload: Joi.object({
      //     id: Joi.string().required(),
      //     text: Joi.string().required()
      //   })
      // }
    }
  },
  {
    method: 'POST',
    path: '/creat/comment',
    handler: creatCommentForum,
    options: { auth: false }
  },


  {
    method: 'POST',
    path: '/like/create',
    handler: likesCreate,
    options: { auth: false }
  },


  {
    method: 'POST',
    path: '/delete/news',
    handler: deleteNews,
    options: { auth: false }
  },

  {
    method: 'POST',
    path: '/delete/comment',
    handler: deleteComment,
    options: { auth: false }
  },

  {
    method: 'POST',
    path: '/find/user',
    handler: findUserInfo,
    options: { auth: false }
  },


];
