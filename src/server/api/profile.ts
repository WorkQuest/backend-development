import { error, output } from '../utils';
import { User } from "../models/User";
import { isMediaExists } from '../utils/storageService';
import { Media } from '../models/Media';
import { Errors } from '../utils/errors';

export async function getMe(r) {
  return output(await User.findByPk(r.auth.credentials.id));
}

export async function setAvatar(r) {
  const media = await Media.findOne({ where: { id: r.payload.mediaId } })
  const user = r.auth.credentials;

  if (!media) {
    return error(Errors.NotFound, 'Media is not found', {});
  }
  if (!await isMediaExists(media)) {
    return error(Errors.NotFound, 'Media is not exists', {});
  }

  await user.update({ avatar: media.id });

  return output();
}
