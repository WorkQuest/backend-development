import {literal, Op} from "sequelize";
import {addSendSmsJob} from '../jobs/sendSms';
import {getRandomCodeNumber, output} from '../utils';
import {UserController} from "../controllers/user/controller.user";
import {transformToGeoPostGIS} from "../utils/postGIS";
import {MediaController} from "../controllers/controller.media";
import {SkillsFiltersController} from "../controllers/controller.skillsFilters";
import {
  User,
  UserRole,
  UserSpecializationFilter,
  Quest, RatingStatistic
} from "@workquest/database-models/lib/models";

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
  const userController = new UserController(await User.findByPk(r.params.userId));

  userController.
    checkNotSeeYourself(r.auth.credentials.id)

  return output(userController.user);
}

export function getUsers(role: UserRole) {
  return async function(r) {
    const entersAreaLiteral = literal(
      'st_within("User"."locationPostGIS", st_makeenvelope(:northLng, :northLat, :southLng, :southLat, 4326))'
    );

    const order = [];
    const include = [];
    let distinctCol: '"User"."id"' | 'id' = '"User"."id"';

    const where = {
      ...(r.query.north && r.query.south && { [Op.and]: entersAreaLiteral }), role,
      ...(role === UserRole.Worker && r.query.betweenWagePerHour && { wagePerHour: { [Op.between]: [r.query.betweenWagePerHour.from, r.query.betweenWagePerHour.to] } }),
    };

    if (r.query.q) {
      where[Op.or] = searchFields.map(
        field => ({ [field]: { [Op.iLike]: `%${r.query.q}%` }})
      );
    }
    if (r.query.specialization && role === UserRole.Worker) {
      const { industryKeys, specializationKeys } = SkillsFiltersController.splitSpecialisationAndIndustry(r.query.specialization);

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

      distinctCol = 'id';
    }

    if(r.query.ratingStatus) {
      include.push({
        model: RatingStatistic,
        as: 'ratingStatistic',
        where: {
          status: r.query.ratingStatus
        },
        required: true
      });

      distinctCol = 'id';
    }

    for (const [key, value] of Object.entries(r.query.sort)) {
      order.push([key, value]);
    }

    const { count, rows } = await User.findAndCountAll({
      distinct: true,
      col: distinctCol, // so..., else not working
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

    return output({ count, users: rows });
  }
}

export async function setRole(r) {
  const user: User = r.auth.credentials;
  const userController = new UserController(user);

  await userController.userNeedsSetRole();

  await userController.setRole(r.payload.role);

  return output();
}

export function editProfile(userRole: UserRole) {
  return async function(r) {
    const user: User = r.auth.credentials;
    const userController = new UserController(user);

    await userController.userMustHaveRole(userRole);

    const avatarId = r.payload.avatarId ? (await MediaController.getMedia(r.payload.avatarId)).id : null;
    const transaction = await r.server.app.db.transaction();

    if (userRole === UserRole.Worker) {
      await userController.setUserSpecializations(r.payload.specializationKeys, transaction);
    }

    await user.update({
      avatarId: avatarId,
      lastName: r.payload.lastName,
      location: r.payload.location,
      firstName: r.payload.firstName,
      additionalInfo: r.payload.additionalInfo,
      locationPostGIS: r.payload.location ? transformToGeoPostGIS(r.payload.location) : null,
      wagePerHour: userRole === UserRole.Worker ? r.payload.wagePerHour : null,
    }, transaction);

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

  const userController = new UserController(user);

  await userController.checkPassword(r.payload.oldPassword);

  const transaction = await r.server.app.db.transaction();

  await userController.changePassword(r.payload.newPassword, transaction);
  await userController.logoutAllSessions(transaction);

  await transaction.commit();

  return output();
}

export async function confirmPhoneNumber(r) {
  const user = await User.scope("withPassword").findByPk(r.auth.credentials.id);

  const userController = new UserController(user);

  await userController.userMustHaveVerificationPhone();
  await userController.checkPhoneConfirmationCode(r.payload.confirmCode);

  await userController.confirmPhoneNumber();

  return output();
}

export async function sendCodeOnPhoneNumber(r) {
  const userWithPassword = await User.scope("withPassword").findByPk(r.auth.credentials.id);
  const confirmCode = getRandomCodeNumber();

  const userController = new UserController(userWithPassword);

  await userController.setUnverifiedPhoneNumber(r.payload.phoneNumber, confirmCode);

  await addSendSmsJob({
    toPhoneNumber: r.payload.phoneNumber,
    message: 'Code to confirm your phone number on WorkQuest: ' + confirmCode,
  });

  return output();
}
