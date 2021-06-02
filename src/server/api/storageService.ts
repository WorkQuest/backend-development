import { Media } from '../models/Media';
import { generateMediaHash, getUploadUrlS3 } from '../utils/storageService';
import { output } from '../utils';
import config from '../config/config';

export async function getUploadLink(r) {
  const hash = generateMediaHash(60);
  const uploadUrl = getUploadUrlS3(hash, r.query.contentType);
  const media = await Media.create({
    userId: r.auth.credentials.id,
    contentType: r.query.contentType,
    url: config.cdn.pubUrl + '/' + hash,
    hash: hash,
  });

  return output({
    mediaId: media.id,
    url: decodeURI(uploadUrl),
  });
}
