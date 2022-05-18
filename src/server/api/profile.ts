import { literal, Op } from "sequelize";
import { addSendSmsJob } from "../jobs/sendSms";
import { error, getRandomCodeNumber, output } from "../utils";
import { UserController, UserOldController } from "../controllers/user/controller.user";
import { transformToGeoPostGIS } from "../utils/postGIS";
import { MediaController } from "../controllers/controller.media";
import { SkillsFiltersController } from "../controllers/controller.skillsFilters";
import { addUpdateReviewStatisticsJob } from "../jobs/updateReviewStatistics";
import { updateUserRaiseViewStatusJob } from "../jobs/updateUserRaiseViewStatus";
import { updateQuestsStatisticJob } from "../jobs/updateQuestsStatistic";
import { deleteUserFiltersJob } from "../jobs/deleteUserFilters";
import { Errors } from "../utils/errors";
import {
  UserChatsStatistic,
  Quest,
  EmployerProfileVisibilitySetting,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsStatistic,
  QuestStatus,
  RatingStatistic, RatingStatus,
  ReferralProgramAffiliate,
  User,
  UserChangeRoleData,
  UserRaiseStatus,
  UserRaiseView,
  UserRole,
  UserStatus,
  Wallet,
  WorkerProfileVisibilitySetting
} from "@workquest/database-models/lib/models";
import { convertAddressToHex } from "../utils/profile";

export const searchFields = [
  "firstName",
  "lastName",
  "locationPlaceName",
];

export async function getMe(r) {
  const user: User = r.auth.credentials;

  const totpIsActiveLiteral = literal(`"User"."settings"->'security'->'TOTP'->'active'`);

  const include = [
    { model: Wallet, as: 'wallet', attributes: ['address'] },
    { model: ReferralProgramAffiliate.unscoped(), as: 'affiliateUser', attributes: ['referralCodeId'] },
  ] as any;

  if (user.role === UserRole.Employer) {
    include.push({
      model: EmployerProfileVisibilitySetting,
      as: 'employerProfileVisibilitySetting',
    });
  }
  if (user.role === UserRole.Worker) {
    include.push({
      model: WorkerProfileVisibilitySetting,
      as: 'workerProfileVisibilitySetting',
    });
  }

  const meUser = await User.findByPk(r.auth.credentials.id, {
    attributes: { include: [[totpIsActiveLiteral, 'totpIsActive']] },
    include,
  });

  return output(meUser);
}

export async function getUser(r) {
  const user = await User.findByPk(r.params.userId, {
    include: [{ model: Wallet, as: 'wallet', attributes: ['address'] }],
  });
  const userController = new UserOldController(user);

  await userController
    .checkNotSeeYourself(r.auth.credentials.id)
    .userMustHaveStatus(UserStatus.Confirmed)

  return output(userController.user);
}

export async function getUserByWallet(r) {
  const address = convertAddressToHex(r.params.address);

  const user = await User.findOne({
    include: [{
      model: Wallet,
      as: 'wallet',
      required: true,
      where: { address },
      attributes: ['address'],
    }]
  });
  const userController = new UserOldController(user);

  userController
    .checkNotSeeYourself(r.auth.credentials.id)
    .userMustHaveStatus(UserStatus.Confirmed);

  return output(userController.user);
}

export async function getAllUsers(r) {
  const user: User = r.auth.credentials;

  const employerProfileVisibilitySearchLiteral = literal(
    `( CASE WHEN "User"."role" = 'worker' THEN ` +
    '(CASE WHEN EXISTS (SELECT "usr"."id" FROM "Users" as "usr" ' +
    `INNER JOIN "EmployerProfileVisibilitySettings" as "pvs" ON "pvs"."userId" = '${ user.id }' ` +
    'INNER JOIN "RatingStatistics" as rtn ON "rtn"."userId" = "User"."id" ' +
    'WHERE ("rtn"."status" & "pvs"."ratingStatusInMySearch" != 0)) THEN TRUE ELSE FALSE END) ' +
    'ELSE TRUE END) '
  );
  const workerProfileVisibilitySearchLiteral = literal(
    `( CASE WHEN "User"."role" = 'worker' THEN ` +
    '(CASE WHEN EXISTS (SELECT "usr"."id" FROM "Users" as "usr" ' +
    `INNER JOIN "WorkerProfileVisibilitySettings" as "pvs" ON "pvs"."userId" = '${ user.id }' ` +
    'INNER JOIN "RatingStatistics" as rtn ON "rtn"."userId" = "User"."id" ' +
    'WHERE ("rtn"."status" & "pvs"."ratingStatusInMySearch" != 0)) THEN TRUE ELSE FALSE END) ' +
    'ELSE TRUE END) '
  );

  const where = {
    status: UserStatus.Confirmed,
    id: { [Op.ne]: r.auth.credentials.id }
  };
  where[Op.and] = [];

  const include = [{
    model: Wallet,
    as: 'wallet',
    attributes: ['address'],
    required: r.query.walletRequired,
  }] as any;

  if (r.query.q) {
    where[Op.or] = searchFields.map(
      field => ({ [field]: { [Op.iLike]: `%${r.query.q}%` }})
    );
  }

  if (r.auth.credentials.role === UserRole.Worker) {
    include.push({
      model: WorkerProfileVisibilitySetting,
      as: 'workerProfileVisibilitySetting',
    }) && where[Op.and].push(workerProfileVisibilitySearchLiteral);
  }
  if (r.auth.credentials.role === UserRole.Employer) {
    include.push({
      model: EmployerProfileVisibilitySetting,
      as: 'employerProfileVisibilitySetting',
    }) && where[Op.and].push(employerProfileVisibilitySearchLiteral);
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    col: 'id',
    distinct: true,
    include,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, users: rows });
}

export function getUsers(role: UserRole, type: 'points' | 'list') {
  return async function(r) {
    const user: User = r.auth.credentials;

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
    const userRaiseViewLiteral = literal(
      '(SELECT "type" FROM "UserRaiseViews" WHERE "userId" = "User"."id" AND "UserRaiseViews"."status" = 0)'
    );
    const userRatingStatisticLiteral = literal(
      `(SELECT CASE WHEN "User"."status" = ${ RatingStatus.TopRanked } THEN 0 WHEN "User"."status" = ${ RatingStatus.Reliable } THEN 1 ` +
      `WHEN "User"."status" = ${ RatingStatus.Verified } THEN 2 WHEN "User"."status" = ${ RatingStatus.NoStatus } THEN 3 END ` +
      `FROM "RatingStatistics" WHERE "userId" = "User"."id") `
    );
    const employerProfileVisibilitySearchLiteral = literal(
      `( CASE WHEN "User"."role" = 'worker' THEN ` +
      '(CASE WHEN EXISTS (SELECT "usr"."id" FROM "Users" as "usr" ' +
      `INNER JOIN "EmployerProfileVisibilitySettings" as "pvs" ON "pvs"."userId" = '${ user.id }' ` +
      'INNER JOIN "RatingStatistics" as rtn ON "rtn"."userId" = "User"."id" ' +
      'WHERE ("rtn"."status" & "pvs"."ratingStatusInMySearch" != 0)) THEN TRUE ELSE FALSE END) ' +
      'ELSE TRUE END) '
    );
    const workerProfileVisibilitySearchLiteral = literal(
      `( CASE WHEN "User"."role" = 'worker' THEN ` +
      '(CASE WHEN EXISTS (SELECT "usr"."id" FROM "Users" as "usr" ' +
      `INNER JOIN "WorkerProfileVisibilitySettings" as "pvs" ON "pvs"."userId" = '${ user.id }' ` +
      'INNER JOIN "RatingStatistics" as rtn ON "rtn"."userId" = "User"."id" ' +
      'WHERE ("rtn"."status" & "pvs"."ratingStatusInMySearch" != 0)) THEN TRUE ELSE FALSE END) ' +
      'ELSE TRUE END) '
    );

    const order = [[userRaiseViewLiteral, 'asc'], [userRatingStatisticLiteral, 'asc']] as any;
    const include = [];
    const replacements = {};
    let distinctCol: '"User"."id"' | 'id' = '"User"."id"';

    const where = {
      role, [Op.and]: [],
      status: UserStatus.Confirmed,
      ...(r.query.priorities && { priority: r.query.priorities }),
      ...(r.query.workplaces && { workplace: r.query.workplaces }),
      ...(r.query.betweenCostPerHour && { costPerHour: { [Op.between]: [r.query.betweenCostPerHour.from, r.query.betweenCostPerHour.to] } }),
      ...(r.query.payPeriods && { payPeriod: { [Op.in]: r.query.payPeriods } }),
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
      //distinctCol = 'id';
    }
    if (r.query.northAndSouthCoordinates) {
      replacements['northLng'] = r.query.northAndSouthCoordinates.north.longitude;
      replacements['northLat'] = r.query.northAndSouthCoordinates.north.latitude;
      replacements['southLng'] = r.query.northAndSouthCoordinates.south.longitude;
      replacements['southLat'] = r.query.northAndSouthCoordinates.south.latitude;

      where[Op.and].push(entersAreaLiteral);
    }
    if (role === UserRole.Worker && r.payload.specializations) {
      const { paths, industryKeys } = SkillsFiltersController.splitPathsAndSingleKeysOfIndustry(r.payload.specializations);

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

      //distinctCol = '"User"."id"';
    }

    for (const [key, value] of Object.entries(r.query.sort || {})) {
      order.push([key, value]);
    }

    if (r.auth.credentials.role === UserRole.Worker) {
      include.push({
        model: WorkerProfileVisibilitySetting,
        as: 'workerProfileVisibilitySetting',
      }) && where[Op.and].push(workerProfileVisibilitySearchLiteral);
    }
    if (r.auth.credentials.role === UserRole.Employer) {
      include.push({
        model: EmployerProfileVisibilitySetting,
        as: 'employerProfileVisibilitySetting',
      }) && where[Op.and].push(employerProfileVisibilitySearchLiteral);
    }
    if (type === 'list') {
      const { count, rows } = await User.findAndCountAll({
        distinct: true,
        col: 'id', //'distinctCol', // so..., else not working
        limit: r.query.limit,
        offset: r.query.offset,
        include, order, where,
        replacements,
      });

      return output({ count, users: rows });
    } else if (type === 'points') {
      const users = await User.findAll({
        include, order, where, replacements,
      });

      return output({ users });
    }
  };
}

export async function setRole(r) {
  const user: User = r.auth.credentials;
  const userController = new UserOldController(user);

  await userController.userNeedsSetRole();

  await userController.setRole(r.payload.role);

  await UserController.createProfileVisibility({ userId: user.id, role: r.payload.role });

  return output();
}

export function editProfile(userRole: UserRole) {
  return async function (r) {
    const user: User = r.auth.credentials;
    const userOldController = new UserOldController(user);
    const userController = new UserController(user);

    await userOldController.userMustHaveRole(userRole);

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
      await userOldController.setUserSpecializations(r.payload.specializationKeys, transaction);

      await userController.updateWorkerProfileVisibility(r.payload.profileVisibility, { tx: transaction });
    }
    if (userRole === UserRole.Employer) {
      await userController.updateEmployerProfileVisibility(r.payload.profileVisibility, { tx: transaction });
    }

    await user.update({
      ...phonesFields,
      ...locationFields,
      avatarId: avatarId,
      lastName: r.payload.lastName,
      firstName: r.payload.firstName,
      priority: r.payload.priority || null,
      workplace: r.payload.workplace || null,
      payPeriod: r.payload.payPeriod || null,
      costPerHour: r.payload.costPerHour || null,
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

  const userController = new UserOldController(user);

  await userController.checkPassword(r.payload.oldPassword);

  const transaction = await r.server.app.db.transaction();

  await userController.changePassword(r.payload.newPassword, transaction);
  await userController.logoutAllSessions(transaction);

  await transaction.commit();

  return output();
}

export async function confirmPhoneNumber(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);

  const userController = new UserOldController(user);

  await userController
    .userMustHaveVerificationPhone()
    .checkPhoneConfirmationCode(r.payload.confirmCode)
    .confirmPhoneNumber()

  return output();
}

export async function sendCodeOnPhoneNumber(r) {
  const userWithPassword = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const confirmCode = getRandomCodeNumber();

  const userController = new UserOldController(userWithPassword);

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
  const chatsStatistic = await UserChatsStatistic.findOne({
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

export async function changeUserRole(r) {
  const roleChangeTimeLimitInMilliseconds = 60000; /** 1 Mount - 2592000000, for DEBUG - 1 minute */

  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const userController = new UserOldController(user);

  const changeToRole = user.role === UserRole.Worker ? UserRole.Employer : UserRole.Worker;

  const lastRoleChangeData = await UserChangeRoleData.findOne({
    where: { userId: user.id },
    order: [['createdAt', 'DESC']],
  });

  const userRegistrationDate: Date = user.createdAt;
  const lastRoleChangeDate: Date | null = lastRoleChangeData ? lastRoleChangeData.createdAt : null;

  const allowedChangeRoleFromDateInMilliseconds = lastRoleChangeData ?
    lastRoleChangeDate.getTime() + roleChangeTimeLimitInMilliseconds :
    userRegistrationDate.getTime() + roleChangeTimeLimitInMilliseconds

  userController
    .userMustHaveStatus(UserStatus.Confirmed)
    .userMustHaveActiveStatusTOTP(true)
    .checkTotpConfirmationCode(r.payload.totp)

  if (Date.now() < allowedChangeRoleFromDateInMilliseconds) {
    return error(Errors.Forbidden, 'Role change timeout has not passed yet', {
      endDateOfTimeout: new Date(allowedChangeRoleFromDateInMilliseconds),
    });
  }

  if (user.role === UserRole.Worker) {
    const questCount = await Quest.count({
      where: {
        assignedWorkerId: user.id,
        status: { [Op.notIn]: [QuestStatus.Closed, QuestStatus.Completed, QuestStatus.Blocked] }
      }
    });
    const questsResponseCount = await QuestsResponse.count({
      where: {
        workerId: user.id,
        status: { [Op.notIn]: [QuestsResponseStatus.Closed, QuestsResponseStatus.Rejected] }
      }
    });

    if (questCount !== 0) {
      return error(Errors.HasActiveQuests, 'There are active quests', { questCount });
    }
    if (questsResponseCount !== 0) {
      return error(Errors.HasActiveResponses, 'There are active responses', { questsResponseCount });
    }
  }
  if (user.role === UserRole.Employer) {
    const questCount = await Quest.count({
      where: { userId: user.id, status: { [Op.notIn]: [QuestStatus.Closed, QuestStatus.Completed] } }
    });

    if (questCount !== 0) {
      return error(Errors.HasActiveQuests, 'There are active quests', { questCount });
    }
  }

  const transaction = await r.server.app.db.transaction();

  await UserChangeRoleData.create({
    changedAdminId: null,
    userId: user.id,
    movedFromRole: user.role,
    additionalInfo: user.additionalInfo,
    costPerHour: user.costPerHour,
    workplace: user.workplace,
    priority: user.priority,
  }, { transaction });

  await user.update({
    workplace: null,
    costPerHour: null,
    role: changeToRole,
    additionalInfo: UserOldController.getDefaultAdditionalInfo(changeToRole),
  }, { transaction });

  await transaction.commit();

  await deleteUserFiltersJob({
    userId: user.id
  });
  await addUpdateReviewStatisticsJob({
    userId: user.id,
  });
  await updateQuestsStatisticJob({
    userId: user.id,
    role: user.role,
  });

  return output();
}

export async function payForMyRaiseView(r) {
//TODO: логику оплаты
  const userController = new UserOldController(await User.findByPk(r.auth.credentials.id));
  await userController
    .userMustHaveRole(UserRole.Worker)
    .checkUserRaiseViewStatus();

  const [raiseView, isCreated] = await UserRaiseView.findOrCreate({
    where: {
      userId: r.auth.credentials.id
    },
    defaults: {
      userId: r.auth.credentials.id,
      status: UserRaiseStatus.Paid, //TODO: сделать на воркере статус оплачено, тут сменить на Closed
      duration: r.payload.duration,
      type: r.payload.type,
    }
  });

  const endOfRaiseView = new Date(Date.now() + 86400000 * raiseView.duration);

  if (!isCreated) {
    await raiseView.update({
      status: UserRaiseStatus.Paid, //TODO: сделать на воркере статус оплачено, тут сменить на Closed
      duration: r.payload.duration,
      type: r.payload.type,
      endedAt: endOfRaiseView
    });
  } else { await raiseView.update({ endedAt: endOfRaiseView }) }

  const temporaryEndingOfRaiseView = new Date(Date.now() + 300000);
  await updateUserRaiseViewStatusJob({
    userId: r.auth.credentials.id,
    runAt: temporaryEndingOfRaiseView, /**TODO*/ //endOfRaiseView
  });

  return output();
}
