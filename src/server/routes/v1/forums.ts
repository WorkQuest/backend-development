import * as Joi from 'joi';
import { filesQuerySchema,
  filesOutputSchema } from '../../schemes/files';
import {
  createComment,
  createNews,
  deleteComment,
  deleteNews, findNewsAll,
  deleteLike, createLikes, updateNewsAndComment
  createFile,
  getFiles,
} from "../../api/forums";
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
  }
];
