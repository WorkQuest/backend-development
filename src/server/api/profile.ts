import * as Joi from "joi";
import { error, getRandomCodeNumber, handleValidationError, output } from '../utils';
import { isMediaExists } from "../utils/storageService";
import { Errors } from "../utils/errors";
import { addSendSmsJob } from '../jobs/sendSms';
import {
  getDefaultAdditionalInfo,
  User,
  UserRole,
  UserStatus,
  Media, Language
} from "@workquest/database-models/lib/models";
import {
  userAdditionalInfoEmployerSchema,
  userAdditionalInfoWorkerSchema,
} from "@workquest/database-models/lib/schemes";

function getAdditionalInfoSchema(role: UserRole): Joi.Schema {
  if (role === UserRole.Employer)
    return userAdditionalInfoEmployerSchema;
  else
    return userAdditionalInfoWorkerSchema;
}

export async function getMe(r) {
  return output(await User.findByPk(r.auth.credentials.id, {
    include: [{
      model: Language,
      as: 'languages',
    }],
    attributes: {
      include: ['tempPhone']
    }
  }));
}

export async function setRole(r) {
  const user = await User.findByPk(r.auth.credentials.id);

  if (user.status !== UserStatus.NeedSetRole) {
    return error(Errors.InvalidPayload, "User don't need to set role", {});
  }

  await user.update({
    status: UserStatus.Confirmed,
    role: r.payload.role,
    additionalInfo: getDefaultAdditionalInfo(r.payload.role)
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

export async function confirmPhoneNumber(r) {
  const user = await User.scope("withPassword").findByPk(r.auth.credentials.id);

  if (!user.tempPhone) {
    return error(Errors.InvalidPayload, 'User does not have verification phone', {});
  }
  if (user.settings.phoneConfirm !== r.payload.confirmCode) {
    return error(Errors.Forbidden, 'Confirmation code is not correct', {});
  }

  await user.update({
    phone: user.tempPhone,
    tempPhone: null,
    'settings.phoneConfirm': null,
  });

  return output();
}

export async function sendCodeOnPhoneNumber(r) {
  const user = await User.scope("withPassword").findByPk(r.auth.credentials.id);
  const confirmCode = getRandomCodeNumber();

  await addSendSmsJob({
    toPhoneNumber: r.payload.phoneNumber,
    message: 'Code to confirm your phone number on WorkQuest: ' + confirmCode,
  });

  await user.update({
    tempPhone: r.payload.phoneNumber,
    'settings.phoneConfirm': confirmCode
  });

  return output();
}
