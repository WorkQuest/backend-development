import * as Joi from "joi";
import { Media } from '../models/Media';
import { generateMediaHash, getUploadUrlS3 } from '../utils/storageService';
import { output } from '../utils';

export async function uploadFile(r) {
  const hash = generateMediaHash(60);
  const uploadUrl = getUploadUrlS3(hash, r.payload.contentType)
  const media = await Media.create({
    userId: r.auth.credentials.id,
    contentType: r.payload.contentType,
    url: uploadUrl,
    hash: hash,
  });

  return output({
    mediaId: media.id,
    url: media.url,
  });
}
