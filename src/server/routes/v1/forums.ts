import * as Joi from "joi";
import { emptyOkSchema, outputOkSchema } from '../../schemes';
import { fileIdSchema, fileSchemaInfo } from '../../schemes/files';
import {
  creatCommentForum,
  createFile,
  creatNewsForum,
  deleteComment,
  deleteFile,
  deleteNews,
  findUserInfo,
  likesCreate
} from '../../api/forums';

const idFile = fileIdSchema.label('idNews')


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

  {
    method: 'POST',
    path: '/v1/create/file',
    handler: createFile,
    options: {
      id: 'v1.create.file',
      // auth: false,
      description: `Register new file`,
      tags: ['api', 'file'],
      validate: {
        payload: Joi.object({
          file: fileSchemaInfo.required(),
        })
      },
      response: {
        schema: outputOkSchema(fileSchemaInfo).label('FileResponse')
      }
    }
  },
  {
    method: "DELETE",
    path: "/v1/file/{idFile}",
    handler: deleteFile,
    options: {
      id: "v1.file.deleteFile",
      tags: ["api", "file"],
      // auth: false,
      description: "Delete file in DB",
      validate: {
        params: Joi.object({
          idFile: idFile.required(),
        }).label("DeleteFile")
      },
      response: {
        schema: emptyOkSchema
      },
    },
  }
];
