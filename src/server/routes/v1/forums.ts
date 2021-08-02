import {
  createComment,
  createNews,
  deleteComment,
  deleteNews, findNewsAll,
  deleteLike, createLikes, updateNewsAndComment, createFile, getFiles
} from "../../api/forums";
import * as Joi from "joi";
import { idSchema, outputOkSchema, shemaNews } from "../../schemes";
import { fileSchemaInfo, filesQuerySchema } from "../../schemes/media";

export default [
  {
    method: "POST",
    path: "/v1/news/create",
    handler: createNews,
    options: {
      id: "v1.forum.createNews",
      tags: ["api", "forum"],
      description: "Create new news, the file is not empty, but if sent, the field is filled",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          text: Joi.string().required().label('Name news'),
          file: Joi.array().label('File info')
        }).label('Create news')
      }
    }
  },
  {
    method: "POST",
    path: "/v1/comment/create",
    handler: createComment,
    options: {
      id: "v1.forum.createComment",
      tags: ["api", "forum"],
      description: "Create new comment",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          idNews: idSchema,
          text: Joi.string().required().label('comment message'),
        }).label('Create comment')
      }
    }
  },
  {
    method: "POST",
    path: "/v1/like/create",
    handler: createLikes,
    options: {
      id: "v1.forum.createLike",
      tags: ["api", "forum"],
      description: "Create like",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: idSchema
        }).label('Create like')
      }
    }
  },
  {
    method: "POST",
    path: "/v1/like/delete",
    handler: deleteLike,
    options: {
      id: "v1.forum.deleteLike",
      tags: ["api", "forum"],
      description: "Delete like",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: idSchema
        }).label('Delete like')
      }
    }
  },
  {
    method: "POST",
    path: "/v1/news/delete",
    handler: deleteNews,
    options: {
      id: "v1.forum.deleteNews",
      tags: ["api", "forum"],
      description: "Delete news",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: idSchema
        }).label('Delete news')
      }
    }
  },
  {
    method: "POST",
    path: "/v1/comment/delete",
    handler: deleteComment,
    options: {
      id: "v1.forum.comment",
      tags: ["api", "forum"],
      description: "Delete comment",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: idSchema,
          idComment: idSchema
        }).label('Delete comment')
      }
    }
  },
  {
    method: "GET",
    path: "/v1/news",
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
    path: "/v1/news/update/",
    handler: updateNewsAndComment,
    options: {
      id: "v1.forum.updateNewsAndComment",
      tags: ["api", "forum"],
      description: "Update news and comment",
      auth: "jwt-access",
      validate: {
        payload: Joi.object({
          id: idSchema,
          text: Joi.string().required().label('Update name news'),
          file: Joi.array().label('Update file info')
        }).label('Update comment')
      }
    }
  },
  {
    method: "POST",
    path: "/v1/file/create",
    handler: createFile,
    options: {
      id: "v1.create.file",
      description: `Register new file`,
      tags: ["api", "file"],
      validate: {
        payload: Joi.object({
          file: fileSchemaInfo.required()
        })
      },
      response: {
        schema: outputOkSchema(fileSchemaInfo).label("File response")
      }
    }
  },
  {
    method: "GET",
    path: "/v1/allFiles",
    handler: getFiles,
    options: {
      id: "v1.files",
      tags: ["api", "file"],
      description: "Get all files",
      validate: {
        query: filesQuerySchema
      },
      response: {
        schema: outputOkSchema(filesQuerySchema).label("FilesResponse")
      }
    }
  }
];
