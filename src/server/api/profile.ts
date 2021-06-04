import { error, output } from '../utils';
import { User, UserRole, UserStatus } from "../models/User";
import { isMediaExists } from '../utils/storageService';
import { Media } from '../models/Media';
import { Errors } from '../utils/errors';

export async function getMe(r) {
  return output(await User.findByPk(r.auth.credentials.id));
}

export async function setAvatar(r) {
  const user = r.auth.credentials;

  if (!r.payload.mediaId) {
    await user.update({ avatarId: null });

    return output();
  }

  const media = await Media.findByPk(r.payload.mediaId);

  if (!media) {
    return error(Errors.NotFound, 'Media is not found', {});
  }
  if (!await isMediaExists(media)) {
    return error(Errors.NotFound, 'Media is not exists', {});
  }

  await user.update({ avatarId: media.id });

  return output();
}

export async function setRole(r) {
  const user = await User.findByPk(r.auth.credentials.id);
  if (user.status !== UserStatus.NeedSetRole || Object.values(UserRole).includes(user.role)) {
    return error(Errors.InvalidPayload, "User don't need to set role", {});
  }

  await user.update({ status: UserStatus.Confirmed, role: r.payload.role });

  return output();
}
