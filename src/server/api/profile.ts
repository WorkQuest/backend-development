import * as Joi from "joi";
import { literal, Op } from "sequelize";
import { error, getRandomCodeNumber, handleValidationError, output } from '../utils';
import { isMediaExists } from "../utils/storageService";
import { Errors } from "../utils/errors";
import { addSendSmsJob } from '../jobs/sendSms';
import {
  User,
  Media,
  UserRole,
  UserStatus,
  UserSpecializationFilter,
} from "@workquest/database-models/lib/models";
import {
  userAdditionalInfoEmployerSchema,
  userAdditionalInfoWorkerSchema,
} from "@workquest/database-models/lib/schemes";
import { UserController } from "../controllers/user";
import { splitSpecialisationAndIndustry } from "../utils/filters";
import { transformToGeoPostGIS } from "../utils/postGIS";

export const searchFields = [
  "firstName",
  "lastName",
];

// TODO удалить
function getAdditionalInfoSchema(role: UserRole): Joi.Schema {
  if (role === UserRole.Employer)
    return userAdditionalInfoEmployerSchema;
  else
    return userAdditionalInfoWorkerSchema;
}

export async function getMe(r) {
  return output(
    await User.findByPk(r.auth.credentials.id, { attributes: { include: ['tempPhone'] }})
  );
}

export async function getUser(r) {
  if (r.auth.credentials.id === r.params.userId) {
    return error(Errors.Forbidden, 'You can\'t see your profile (use "get me")', {});
  }

  const userController = new UserController(r.params.userId);
  const user = await userController.findModel();

  return output(user);
}

export function getUsers(role: UserRole) {
  return async function(r) {
    const entersAreaLiteral = literal(
      'st_within("User"."locationPostGIS", st_makeenvelope(:northLng, :northLat, :southLng, :southLat, 4326))'
    );

    const order = [];
    const include = [];

    const where = {
      ...(r.query.north && r.query.south && { [Op.and]: entersAreaLiteral }), role,
    };

    if (r.query.q) {
      where[Op.or] = searchFields.map(
        field => ({ [field]: { [Op.iLike]: `%${r.query.q}%` }})
      );
    }
    if (r.query.specialization && role === UserRole.Worker) {
      const { industryKeys, specializationKeys } = splitSpecialisationAndIndustry(r.query.specialization);

      include.push({
        model: UserSpecializationFilter,
        as: 'userIndustryForFiltering',
        attributes: [],
        where: { industryKey: { [Op.in]: industryKeys } },
      })

      if (specializationKeys.length > 0) {
        include.push({
          model: UserSpecializationFilter,
          as: 'userSpecializationForFiltering',
          attributes: [],
          where: { specializationKey: { [Op.in]: specializationKeys } },
        });
      }
    }

    for (const [key, value] of Object.entries(r.query.sort)) {
      order.push([key, value]);
    }

    const { count, rows } = await User.findAndCountAll({
      distinct: true,
      col: '"User"."id"',
      limit: r.query.limit,
      offset: r.query.offset,
      include, order, where,
      replacements: {
        ...(r.query.north && r.query.south && {
          northLng: r.query.north.longitude,
          northLat: r.query.north.latitude,
          southLng: r.query.south.longitude,
          southLat: r.query.south.latitude,
        })
      }
    });

    return output({count, users: rows});
  }
}

export async function setRole(r) {
  const user: User = r.auth.credentials;
  const userController = new UserController(user.id, user);

  await userController.userNeedsSetRole();

  await user.update({
    role: r.payload.role,
    status: UserStatus.Confirmed,
    additionalInfo: UserController.getDefaultAdditionalInfo(r.payload.role),
  });

  return output();
}

// TODO удалить
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
    // locationPostGIS: r.payload.location ? transformToGeoPostGIS(r.payload.location) : null,
  };

  await user.update(userFieldsUpdate, { transaction });

  await transaction.commit();

  return output(
    await User.findByPk(user.id)
  );
}

export function editProfile(userRole: UserRole) {
  return async function(r) {
    const user: User = r.auth.credentials;
    const userController = new UserController(user.id, user);

    await userController.userMustHaveRole(userRole);

    const transaction = await r.server.app.db.transaction();

    userController.setTransaction(transaction);
    await userController.setAvatar(r.payload.avatarId);

    await user.update({
      lastName: r.payload.lastName,
      location: r.payload.location,
      firstName: r.payload.firstName,
      additionalInfo: r.payload.additionalInfo,
      locationPostGIS: r.payload.location ? transformToGeoPostGIS(r.payload.location) : null,
    }, transaction);

    if (userRole === UserRole.Worker) {
      await userController.setUserSpecializations(r.payload.specializationKeys);
    }

    await transaction.commit();

    return output(
      await User.findByPk(r.auth.credentials.id)
    );
  }
}

export async function changePassword(r) {
  const user = await User.scope("withPassword").findOne({
    where: { id: r.auth.credentials.id }
  });
  const userController = new UserController(user.id, user);

  await userController.checkPassword(r.payload.oldPassword);
  await user.update({ password: r.payload.newPassword });

  return output();
}

export async function confirmPhoneNumber(r) {
  const user = await User.scope("withPassword").findByPk(r.auth.credentials.id);
  const userController = new UserController(user.id, user);

  await userController.userMustHaveVerificationPhone();
  await userController.checkPhoneConfirmationCode(r.payload.confirmCode);

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
    'settings.phoneConfirm': confirmCode,
  });

  return output();
}
