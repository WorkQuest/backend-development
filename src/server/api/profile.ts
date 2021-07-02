import * as Joi from "joi";
import { error, handleValidationError, output } from '../utils';
import { User, UserRole, UserStatus } from '../models/User';
import { isMediaExists } from '../utils/storageService';
import { Media } from '../models/Media';
import { Errors } from '../utils/errors';
import { additionalInfoEmployerSchema, additionalInfoWorkerSchema } from '../schemes/user';

function getAdditionalInfoSchema(role: UserRole): Joi.Schema {
  if (role === UserRole.Employer)
    return additionalInfoEmployerSchema;
  else
    return additionalInfoWorkerSchema;
}

export async function getMe(r) {
  return output(await User.findByPk(r.auth.credentials.id));
}

export async function setRole(r) {
  const user = await User.findByPk(r.auth.credentials.id);
  let additionalInfo: object = {
    firstMobileNumber: null,
    secondMobileNumber: null,
    address: null,
    socialNetwork: {
      instagram:  null,
      twitter:  null,
      linkedin:  null,
      facebook:  null,
    }
  };

  if (user.status !== UserStatus.NeedSetRole || Object.values(UserRole).includes(user.role)) {
    return error(Errors.InvalidPayload, "User don't need to set role", {});
  }
  if (r.payload.role === UserRole.Worker) {
    additionalInfo = {
      ...additionalInfo,
      description: null,
      skills: [],
      educations: [],
      workExperiences: [],
    };
  } else if (r.payload.role === UserRole.Employer) {
    additionalInfo = {
      ...additionalInfo,
      company: null,
      CEO: null,
      website: null,
    }
  }

  await user.update({
    status: UserStatus.Confirmed,
    role: r.payload.role,
    additionalInfo,
  });

  return output();
}

export async function editProfile(r) {
  const user = r.auth.credentials;
  const additionalInfoSchema = getAdditionalInfoSchema(user.role);
  const validateAdditionalInfo = additionalInfoSchema.validate(r.payload.additionalInfo);

  if (validateAdditionalInfo.error) {
    return await handleValidationError(r, null, validateAdditionalInfo.error);
  }
  if (r.payload.avatarId) {
    const media = await Media.findByPk(r.payload.avatarId);
    if (!media) {
      return error(Errors.NotFound, 'Media is not found', {
        avatarId: r.payload.avatarId
      });
    }
    if (!await isMediaExists(media)) {
      return error(Errors.NotFound, 'Media is not exists', {
        avatarId: r.payload.avatarId
      });
    }
  }

  await user.update({
    ...r.payload
  });

  return output(
    await User.findByPk(user.id)
  );
}

export async function changePassword(r) {
  const user = await User.scope("withPassword").findOne({
    where: {
      id: r.auth.credentials.id
    }
  });

  if (!(await user.passwordCompare(r.payload.oldPassword))) {
    return error(Errors.Forbidden, 'Old password does not match with current', {});
  }

  await user.update({
    password: r.payload.newPassword
  });

  return output();
}
