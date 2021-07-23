import * as Joi from 'joi';
import { outputOkSchema } from '../../schemes';
import { fileSchemaInfo,filesQuerySchema,
  filesOutputSchema } from '../../schemes/files';
import {
  createFile,
  getFiles,
} from "../../api/forums";



export default [

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
