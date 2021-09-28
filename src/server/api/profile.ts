import * as Joi from "joi";
import { error, getRandomCodeNumber, handleValidationError, output } from "../utils";
import { isMediaExists } from "../utils/storageService";
import { Errors } from "../utils/errors";
import { addSendSmsJob } from "../jobs/sendSms";
import {
  getDefaultAdditionalInfo,
  Media,
  SkillFilter,
  User,
  UserRole,
  UserStatus
} from "@workquest/database-models/lib/models";
import {
  userAdditionalInfoEmployerSchema,
  userAdditionalInfoWorkerSchema
} from "@workquest/database-models/lib/schemes";
import { transformToGeoPostGIS } from "@workquest/database-models/lib/utils/quest";

/** TODO: Old, delete later with editProfile */
function getAdditionalInfoSchema(role: UserRole): Joi.Schema {
  if (role === UserRole.Employer)
    return userAdditionalInfoEmployerSchema;
  else
    return userAdditionalInfoWorkerSchema;
}

export async function getMe(r) {
  return output(await User.findByPk(r.auth.credentials.id, {
    attributes: { include: ['tempPhone'] }
  }));
}

export async function getUser(r) {
  if (r.auth.credentials.id === r.params.userId) {
    return error(Errors.Forbidden, 'You can\'t see your profile (use "get me")', {});
  }

  const user = await User.findByPk(r.params.userId);

  if (!user) {
    throw error(Errors.NotFound, 'User not found', {});
  }

  return output(user);
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

/** TODO: Old, delete later with getAdditionalInfoSchema */
export async function editProfiles(r) {
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

  const transaction = await r.server.app.db.transaction();
  const userFieldsUpdate = {
    ...r.payload,
    locationPostGIS: r.payload.location ? transformToGeoPostGIS(r.payload.location) : null,
  };

  await user.update(userFieldsUpdate, { transaction });
  await SkillFilter.destroy({ where: { userId: user.id }, transaction });

  if (r.payload.skillFilters) {
    const userSkillFilters = SkillFilter.toRawUserSkills(r.payload.skillFilters, user.id);

    await SkillFilter.bulkCreate(userSkillFilters, { transaction });
  }

  await transaction.commit();

  return output(
    await User.findByPk(user.id)
  );
}

export function editProfile(userRole: UserRole) {
  return async function(r) {
    if (r.auth.credentials.role !== userRole) {
      return error(Errors.InvalidRole, 'User does not match role', {userRole});
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

    const transaction = await r.server.app.db.transaction();
    const userFieldsUpdate = {
      ...r.payload,
      locationPostGIS: r.payload.location ? transformToGeoPostGIS(r.payload.location) : null,
    };

    await User.update(userFieldsUpdate, { where: {id: r.auth.credentials.id }, transaction });

    if (userRole === UserRole.Worker) {
      await SkillFilter.destroy({ where: { userId: r.auth.credentials.id }, transaction });

      if (r.payload.skillFilters) {
        const userSkillFilters = SkillFilter.toRawUserSkills(r.payload.skillFilters, r.auth.credentials.id);

        await SkillFilter.bulkCreate(userSkillFilters, { transaction });
      }
    }

    await transaction.commit();

    return output(
      await User.findByPk(r.auth.credentials.id)
    );
  }
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

export async function getUsers(r) {

}
