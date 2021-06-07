import * as Joi from "joi";
import { getUploadLink } from '../../api/storageService';
import { contentTypeSchema } from '../../schemes/media';
import { idSchema, outputOkSchema, urlSchema } from '../../schemes';

const uploadLinkSchema = Joi.object({
  mediaId: idSchema.label('MediaId'),
  url: urlSchema,
}).label('UploadLink');

export default [{
  method: "POST",
  path: "/v1/storage/get-upload-link",
  handler: getUploadLink,
  options: {
    id: "v1.storage.getUploadLink",
    tags: ["api", "storage"],
    description: "Upload file in storage",
    validate: {
      payload: Joi.object({
        contentType: contentTypeSchema.required()
      }).label('UploadFilePayload')
    },
    response: {
      schema: outputOkSchema(uploadLinkSchema).label('UploadLinkResponse')
    }
  }
}];
