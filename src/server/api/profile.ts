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
  RatingStatistic,
  Wallet
} from "@workquest/database-models/lib/models";
import { addUpdateReviewStatisticsJob } from "../jobs/updateReviewStatistics";

export const searchFields = [
  "firstName",
  "lastName",
];

export async function getMe(r) {
  const user = await User.findByPk(r.auth.credentials.id, {
    attributes: { include: ['tempPhone'] },
    include: [{ model: Wallet, as: 'wallet', attributes: ['address'] }]
  });

  return output(user);
}

export async function getUser(r) {
  const userController = new UserController(await User.findByPk(r.params.userId));

  userController.
    checkNotSeeYourself(r.auth.credentials.id)

  return output(userController.user);
}

export async function getAllUsers(r) {
  const where = {};

  if (r.query.q) {
    where[Op.or] = searchFields.map(
      field => ({ [field]: { [Op.iLike]: `%${r.query.q}%` }})
    );
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    distinct: true,
    col: '"User"."id"',
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, users: rows });
}

export function getUsers(role: UserRole) {
  return async function(r) {
    const entersAreaLiteral = literal(
      'st_within("User"."locationPostGIS", st_makeenvelope(:northLng, :northLat, :southLng, :southLat, 4326))'
    );
    const userSpecializationOnlyPathsLiteral = literal(
      '(1 = (CASE WHEN EXISTS (SELECT * FROM "UserSpecializationFilters" WHERE "userId" = "User"."id" AND "UserSpecializationFilters"."path" IN (:path)) THEN 1 END))'
    );
    const userSpecializationOnlyIndustryKeysLiteral = literal(
      '(1 = (CASE WHEN EXISTS (SELECT * FROM "UserSpecializationFilters" WHERE "userId" = "User"."id" AND "UserSpecializationFilters"."industryKey" IN (:industryKey)) THEN 1 END))'
    );
    const userSpecializationIndustryKeysAndPathsLiteral = literal(
      '(1 = (CASE WHEN EXISTS (SELECT * FROM "UserSpecializationFilters" WHERE "userId" = "User"."id" AND "UserSpecializationFilters"."path" IN (:path)) THEN 1 END))' +
      'OR (1 = (CASE WHEN EXISTS (SELECT * FROM "UserSpecializationFilters" WHERE "userId" = "User"."id" AND "UserSpecializationFilters"."industryKey" IN (:industryKey)) THEN 1 END))'
    );

    const order = [];
    const include = [];
    const replacements = { };
    let distinctCol: '"User"."id"' | 'id' = '"User"."id"';

    const where = {
      [Op.and]: [], role,
      ...(r.query.workplace && { workplace: r.query.workplace }),
      ...(r.query.priority && {priority: r.query.priority}),
      ...(r.query.betweenWagePerHour && { wagePerHour: {
          [Op.between]: [r.query.betweenWagePerHour.from, r.query.betweenWagePerHour.to]
      } }),
    };

    if (r.query.q) {
      where[Op.or] = searchFields.map(
        field => ({ [field]: { [Op.iLike]: `%${r.query.q}%` }})
      );
    }
    if (r.query.ratingStatus) {
      include.push({
        model: RatingStatistic,
        as: 'ratingStatistic',
        required: true,
        where: { status: r.query.ratingStatus },
      });

      distinctCol = 'id';
    }
    if (r.query.north && r.query.south) {
      replacements['northLng'] = r.query.north.longitude;
      replacements['northLat'] = r.query.north.latitude;
      replacements['southLng'] = r.query.south.longitude;
      replacements['southLat'] = r.query.south.latitude;

      where[Op.and].push(entersAreaLiteral);
    }
    if (r.query.specialization && role === UserRole.Worker) {
      const { paths, industryKeys } = SkillsFiltersController.splitPathsAndSingleKeysOfIndustry(r.query.specialization);

      if (paths.length !== 0 && industryKeys.length === 0) {
        replacements['path'] = paths;
        where[Op.and].push(userSpecializationOnlyPathsLiteral);
      }
      if (paths.length === 0 && industryKeys.length !== 0) {
        replacements['industryKey'] = industryKeys;
        where[Op.and].push(userSpecializationOnlyIndustryKeysLiteral);
      }
      if (paths.length !== 0 && industryKeys.length !== 0) {
        replacements['path'] = paths;
        replacements['industryKey'] = industryKeys;
        where[Op.and].push(userSpecializationIndustryKeysAndPathsLiteral);
      }

      distinctCol = '"User"."id"';
    }

    for (const [key, value] of Object.entries(r.query.sort)) {
      order.push([key, value]);
    }
    console.log(replacements);

    const { count, rows } = await User.findAndCountAll({
      distinct: true,
      col: distinctCol, // so..., else not working
      limit: r.query.limit,
      offset: r.query.offset,
      include, order, where,
      replacements
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
      priority: r.payload.priority || null,
      workplace: r.payload.workplace || null,
      wagePerHour: r.payload.wagePerHour || null,
      additionalInfo: r.payload.additionalInfo,
      locationPostGIS: r.payload.location ? transformToGeoPostGIS(r.payload.location) : null,
    }, transaction);

    await transaction.commit();

    await addUpdateReviewStatisticsJob({
      userId: user.id,
    });

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

export async function getInvestors(r) {
  const users = await User.findAndCountAll({
    distinct: true,
    col: '"User"."id"',
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({count: users.count, users: users.rows});
}
