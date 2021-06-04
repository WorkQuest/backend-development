import { error, output } from '../utils';
import { User, UserRole, UserStatus } from '../models/User';
import { Errors } from '../utils/errors';

export async function getMe(r) {
  return output(await User.findByPk(r.auth.credentials.id));
}

export async function setRole(r) {
  const user = await User.findByPk(r.auth.credentials.id);
  if (user.status !== UserStatus.NeedSetRole || Object.values(UserRole).includes(r.payload.role)) {
    return error(Errors.InvalidPayload, "User don't need to set role", {});
  }

  await user.update({ status: UserStatus.Confirmed, role: r.payload.role });

  return output();
}
