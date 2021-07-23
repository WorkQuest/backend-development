import * as Joi from 'joi';
import { emptyOkSchema, outputOkSchema } from '../../schemes';
import { fileIdSchema, fileSchemaInfo,filesQuerySchema,
  filesOutputSchema } from '../../schemes/files';
import {
  creatCommentForum,
  createFile,
  creatNewsForum,
  deleteComment,
  deleteFile,
  deleteNews,
  findUserInfo, getFiles,
  likesCreate
} from "../../api/forums";
import { deleteQuest, getQuests } from "../../api/quest";
import { questsQuerySchema } from '../../schemes/quest';

const idFile = fileIdSchema.label('idNews');


export default [
  {
    method: 'POST',
    path: '/create/news',
    handler: creatNewsForum,
    options: {
      auth: false
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
      description: `Register new file`,
      tags: ['api', 'file'],
      validate: {
        payload: Joi.object({
          file: fileSchemaInfo.required()
        })
      },
      response: {
        schema: outputOkSchema(fileSchemaInfo).label('FileResponse')
      }
    }
  },
  {
    method: "GET",
    path: "/v1/allFiles",
    handler: getFiles,
    options: {
      id: "v1.files",
      tags: ["api", "files"],
      description: "Get all files",
      validate: {
        query: filesQuerySchema
      },
      response: {
        schema: outputOkSchema(filesOutputSchema).label("FilesResponse")
      },
    }
  },
];
