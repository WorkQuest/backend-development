
import * as Joi from 'joi';
import { emptyOkSchema, outputOkSchema } from '../../schemes';
import { fileIdSchema, fileSchemaInfo,filesQuerySchema,
  filesOutputSchema } from '../../schemes/files';
import {
  createComment,
  createLikes,
  createNews,
  deleteComment,
  deleteLike,
  deleteNews, 
  findNewsAll,
  findNewsComments,
  userInformation,
  getFiles
} from "../../api/forums";
import * as Joi from "@hapi/joi";
import { emptyOkSchema, limitSchema, outputOkSchema } from "../../schemes";
import { createFile, deleteFile } from "../../api/forums";
import { fileIdSchema, fileSchemaInfo } from "../../schemes/files";


const idFile = fileIdSchema.label('idNews');


export default [
  {
    method: 'POST',
    path: '/create/news',
    handler: createNews,
    options: {
      // validate: {
      //   payload: Joi.object({
      //     id: Joi.string().required(),
      //     text: Joi.string().required()
      //   })
      // }
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
