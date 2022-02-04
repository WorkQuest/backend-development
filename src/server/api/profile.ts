import { literal, Op } from 'sequelize';
import { addSendSmsJob } from '../jobs/sendSms';
import { error, getRandomCodeNumber, output } from '../utils';
import { UserController } from '../controllers/user/controller.user';
import { transformToGeoPostGIS } from '../utils/postGIS';
import { MediaController } from '../controllers/controller.media';
import { SkillsFiltersController } from '../controllers/controller.skillsFilters';
import { addUpdateReviewStatisticsJob } from '../jobs/updateReviewStatistics';
import { Errors } from '../utils/errors';
import {
  User,
  Wallet,
  UserRole,
  ChatsStatistic,
  RatingStatistic,
  QuestsStatistic, UserStatus
} from "@workquest/database-models/lib/models";

export const searchFields = [
  "firstName",
  "lastName",
  "locationPlaceName",
];

export async function getMe(r) {
  const totpIsActiveLiteral = literal(`"User"."settings"->'security'->'TOTP'->'active'`);

  const user = await User.findByPk(r.auth.credentials.id, {
    attributes: { include: [[totpIsActiveLiteral, 'totpIsActive']] },
    include: [{ model: Wallet, as: 'wallet', attributes: ['address'] }],
  });

  return output(user);
}

export async function getUser(r) {
  const userController = new UserController(await User.findByPk(r.params.userId));

  userController
    .checkNotSeeYourself(r.auth.credentials.id)
    .userMustHaveStatus(UserStatus.Confirmed)

  return output(userController.user);
}

export async function getAllUsers(r) {
  const where = { status: UserStatus.Confirmed };

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
    const replacements = {};
    let distinctCol: '"User"."id"' | 'id' = '"User"."id"';

    const where = {
      role, [Op.and]: [],
      status: UserStatus.Confirmed,
      ...(r.query.priorities && { priority: r.query.priorities }),
      ...(r.query.workplaces && { workplace: r.query.workplaces }),
      ...(r.query.betweenWagePerHour && { wagePerHour: { [Op.between]: [r.query.betweenWagePerHour.from, r.query.betweenWagePerHour.to] } }),
    };

    if (r.query.q) {
      where[Op.or] = searchFields.map(
        field => ({ [field]: { [Op.iLike]: `%${r.query.q}%` }})
      );
    }
    if (r.query.ratingStatuses) {
      include.push({
        model: RatingStatistic,
        as: 'ratingStatistic',
        required: true,
        where: { status: r.query.ratingStatuses },
      });
      distinctCol = 'id';
    }
    if (r.query.northAndSouthCoordinates) {
      replacements['northLng'] = r.query.northAndSouthCoordinates.north.longitude;
      replacements['northLat'] = r.query.northAndSouthCoordinates.north.latitude;
      replacements['southLng'] = r.query.northAndSouthCoordinates.south.longitude;
      replacements['southLat'] = r.query.northAndSouthCoordinates.south.latitude;

      where[Op.and].push(entersAreaLiteral);
    }
    if (r.query.specializations && role === UserRole.Worker) {
      const { paths, industryKeys } = SkillsFiltersController.splitPathsAndSingleKeysOfIndustry(r.query.specializations);

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

    const { count, rows } = await User.findAndCountAll({
      distinct: true,
      col: distinctCol, // so..., else not working
      limit: r.query.limit,
      offset: r.query.offset,
      include, order, where,
      replacements,
    });

    return output({ count, users: rows });
  };
}

export async function setRole(r) {
  const user: User = r.auth.credentials;
  const userController = new UserController(user);

  await userController.userNeedsSetRole();

  await userController.setRole(r.payload.role);

  return output();
}

export function editProfile(userRole: UserRole) {
  return async function (r) {
    const user: User = r.auth.credentials;
    const userController = new UserController(user);

    await userController.userMustHaveRole(userRole);

    const locationFields = { location: null, locationPostGIS: null, locationPlaceName: null };
    const avatarId = r.payload.avatarId ? (await MediaController.getMedia(r.payload.avatarId)).id : null;
    const phonesFields = r.payload.phoneNumber ? { tempPhone: user.tempPhone, phone: user.phone } : { tempPhone: null, phone: null };

    const transaction = await r.server.app.db.transaction();

    if (r.payload.phoneNumber) {
      if (
        (user.phone && user.phone.fullPhone !== r.payload.phoneNumber.fullPhone) ||
        (user.tempPhone && user.tempPhone.fullPhone !== r.payload.phoneNumber.fullPhone) ||
        (!user.phone && !user.tempPhone)
      ) {
        phonesFields.phone = null;
        phonesFields.tempPhone = r.payload.phoneNumber;
      }
    }
    if (r.payload.locationFull) {
      locationFields.location = r.payload.locationFull.location;
      locationFields.locationPlaceName = r.payload.locationFull.locationPlaceName;
      locationFields.locationPostGIS = transformToGeoPostGIS(r.payload.locationFull.location);
    }
    if (userRole === UserRole.Worker) {
      await userController.setUserSpecializations(r.payload.specializationKeys, transaction);
    }

    await user.update({
      ...phonesFields,
      ...locationFields,
      avatarId: avatarId,
      lastName: r.payload.lastName,
      firstName: r.payload.firstName,
      priority: r.payload.priority || null,
      workplace: r.payload.workplace || null,
      wagePerHour: r.payload.wagePerHour || null,
      additionalInfo: r.payload.additionalInfo,
    }, transaction);

    await transaction.commit();

    await addUpdateReviewStatisticsJob({
      userId: user.id,
    });

    return output(await User.findByPk(r.auth.credentials.id));
  };
}

export async function changePassword(r) {
  const user = await User.scope('withPassword').findOne({
    where: { id: r.auth.credentials.id },
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
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);

  const userController = new UserController(user);

  await userController
    .userMustHaveVerificationPhone()
    .checkPhoneConfirmationCode(r.payload.confirmCode)
    .confirmPhoneNumber()

  return output();
}

export async function sendCodeOnPhoneNumber(r) {
  const userWithPassword = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const confirmCode = getRandomCodeNumber();

  const userController = new UserController(userWithPassword);

  if (userWithPassword.phone) { //TODO Возможно что-то подобное есть
    return error(Errors.PhoneNumberAlreadyConfirmed, 'Phone number already confirmed', {});
  }
  if (!userWithPassword.tempPhone) { // TODO -> userMustHaveVerificationPhone
    return error(Errors.NotFound, 'Phone number for verification not found', {});
  }

  await userController.setConfirmCodeToVerifyCodeNumber(confirmCode);

  await addSendSmsJob({
    toPhoneNumber: userWithPassword.tempPhone.fullPhone,
    message: 'Code to confirm your phone number on WorkQuest: ' + confirmCode,
  });

  return output();
}

export async function getUserStatistics(r) {
  const chatsStatistic = await ChatsStatistic.findOne({
    where: { userId: r.auth.credentials.id },
  });

  const questsStatistic = await QuestsStatistic.findOne({
    where: { userId: r.auth.credentials.id },
  });

  const ratingStatistic = await RatingStatistic.findOne({
    where: { userId: r.auth.credentials.id },
  });

  return output({ chatsStatistic, questsStatistic, ratingStatistic });
}
