import { literal, Op } from "sequelize";
import { Errors } from "../utils/errors";
import { addSendSmsJob } from '../jobs/sendSms';
import { error, getRandomCodeNumber, output } from '../utils';
import { UserController, UserControllerFactory } from "../controllers/user/controller.user";
import { splitSpecialisationAndIndustry } from "../utils/filters";
import { transformToGeoPostGIS } from "../utils/postGIS";
import {
  User,
  Session,
  UserRole,
  UserStatus,
  UserSpecializationFilter,
} from "@workquest/database-models/lib/models";
import config from "../config/config";

export const searchFields = [
  "firstName",
  "lastName",
];

export async function getMe(r) {
  const user = await User.findByPk(r.auth.credentials.id, {
    attributes: { include: ['tempPhone'] }
  });

  return output(user);
}

export async function getUser(r) {
  if (r.auth.credentials.id === r.params.userId) {
    return error(Errors.Forbidden, 'You can\'t see your profile (use "get me")', {});
  }

  const user = await User.findByPk(r.params.userId);
  const userController = await UserControllerFactory.makeControllerByModel(user);

  return output(userController.user);
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
  const userController = new UserController(user);

  await userController.userNeedsSetRole();

  await user.update({
    role: r.payload.role,
    status: UserStatus.Confirmed,
    additionalInfo: UserController.getDefaultAdditionalInfo(r.payload.role),
  });

  return output();
}

export function editProfile(userRole: UserRole) {
  return async function(r) {
    const user: User = r.auth.credentials;
    const userController = new UserController(user);

    await userController.userMustHaveRole(userRole);

    const avatarId = r.payload.avatarId ? (await getMedia(r.payload)).id : null;
    const transaction = await r.server.app.db.transaction();

    await user.update({
      avatarId: avatarId,
      lastName: r.payload.lastName,
      location: r.payload.location,
      firstName: r.payload.firstName,
      additionalInfo: r.payload.additionalInfo,
      locationPostGIS: r.payload.location ? transformToGeoPostGIS(r.payload.location) : null,
    }, transaction);

    if (userRole === UserRole.Worker) {
      await UserController.setUserSpecializations(user, r.payload.specializationKeys, transaction);
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

  const transaction = await r.server.app.db.transaction();
  const userController = new UserController(user, transaction);

  await userController.checkPassword(r.payload.oldPassword);

  await user.update({ password: r.payload.newPassword }, { transaction });

  await Session.update({ invalidating: true }, {
    where: {
      userId: r.auth.credentials.id,
      createdAt: {
        [Op.gte]: Date.now() - config.auth.jwt.refresh.lifetime * 1000
      }
    }, transaction,
  });

  await transaction.commit();

  return output();
}

export async function confirmPhoneNumber(r) {
  const user = await User.scope("withPassword").findByPk(r.auth.credentials.id);

  const userController = new UserController(user);

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
