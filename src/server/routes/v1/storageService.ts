import * as Joi from "joi";
import { getUploadLink } from '../../api/storageService';
import { contentTypeSchema, mediaIdSchema } from '../../schemes/media';
import { outputOkSchema, urlSchema } from '../../schemes';

const uploadFileResponseSchema = Joi.object({
  mediaId: mediaIdSchema,
  url: urlSchema,
});

export default [{
  method: "PUT",
  path: "/v1/storage/get-upload-link",
  handler: getUploadLink,
  options: {
    id: "v1.storage.upload",
    tags: ["api", "storage"],
    description: "Upload file in storage",
    validate: {
      query: Joi.object({
        contentType: contentTypeSchema.required()
      }).label('UploadFilePayload')
    },
    response: {
      schema: outputOkSchema(uploadFileResponseSchema).label('UploadFileResponse')
    }
  }
}];
