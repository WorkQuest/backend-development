import * as Joi from "joi";
import { uploadFile } from '../../api/storageService';
import { contentTypeSchema, mediaIdSchema } from '../../schemes/media';
import { outputOkSchema, urlSchema } from '../../schemes';

const uploadFileResponseSchema = Joi.object({
  mediaId: mediaIdSchema,
  url: urlSchema,
});

export default [{
  method: "POST",
  path: "/v1/storage/get-upload-link",
  handler: uploadFile,
  options: {
    id: "v1.storage.upload",
    tags: ["api", "storage"],
    description: "Upload file in storage",
    validate: {
      payload: Joi.object({
        contentType: contentTypeSchema.required()
      }).label('UploadFilePayload')
    },
    response: {
      schema: outputOkSchema(uploadFileResponseSchema).label('UploadFileResponse')
    }
  }
}];
