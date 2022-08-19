import { literal, Op } from 'sequelize';
import { addSendSmsJob } from '../jobs/sendSms';
import { error, getRandomCodeNumber, output } from '../utils';
import { UserController, UserOldController } from '../controllers/user/controller.user';
import { UserStatisticController } from '../controllers/statistic/controller.userStatistic';
import { SkillsFiltersController } from '../controllers/controller.skillsFilters';
import { addUpdateReviewStatisticsJob } from '../jobs/updateReviewStatistics';
import { updateUserRaiseViewStatusJob } from '../jobs/updateUserRaiseViewStatus';
import { updateQuestsStatisticJob } from '../jobs/updateQuestsStatistic';
import { deleteUserFiltersJob } from '../jobs/deleteUserFilters';
import { convertAddressToHex } from '../utils/profile';
import { Errors } from '../utils/errors';
import {
  ChangeRoleComposHandler,
  EditProfileComposHandler,
  ChangeUserPasswordComposHandler,
} from '../handlers/compositions';
import {
  User,
  Wallet,
  Session,
  UserRole,
  UserStatus,
  RatingStatus,
  UserRaiseView,
  UserRaiseStatus,
  QuestsStatistic,
  RatingStatistic,
  UserChatsStatistic,
  ReferralProgramAffiliate,
  WorkerProfileVisibilitySetting,
  EmployerProfileVisibilitySetting,
} from '@workquest/database-models/lib/models';

export const searchFields = [
  "firstName",
  "lastName",
  "locationPlaceName",
];

export async function getMe(r) {
  const user: User = r.auth.credentials;

  const totpIsActiveLiteral = literal(`"User"."settings"->'security'->'TOTP'->'active'`);
  const neverEditedProfileLiteral = literal(`"User"."metadata"->'state'->'neverEditedProfileFlag'`);

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
    attributes: {
      include: [
        [totpIsActiveLiteral, 'totpIsActive'],
        [neverEditedProfileLiteral, 'neverEditedProfileFlag'],
      ],
    },
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

  const userSearchLiteral = literal(
    `(SELECT "firstName" FROM "Users" WHERE "id" = "User"."id") ILIKE :searchByName ` +
    `OR (SELECT "lastName" FROM "Users" WHERE "id" = "User"."id") ILIKE :searchByName ` +
    `OR (SELECT CONCAT_WS(' ', "firstName", NULL, "lastName") FROM "Users" WHERE "id" = "User"."id")  ILIKE :searchByName ` +
    `OR (SELECT CONCAT_WS(' ', "lastName", NULL, "firstName") FROM "Users" WHERE "id" = "User"."id")  ILIKE :searchByName `
  );

  const replacements = {};

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

    replacements['searchByName'] = `%${r.query.q}%`;
    where[Op.or].push(userSearchLiteral)
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
    replacements,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, users: rows });
}

export async function getAllUsersDao(r) {
  const userSearchLiteral = literal(
    `(SELECT "firstName" FROM "Users" WHERE "id" = "User"."id") ILIKE :searchByName ` +
    `OR (SELECT "lastName" FROM "Users" WHERE "id" = "User"."id") ILIKE :searchByName ` +
    `OR (SELECT CONCAT_WS(' ', "firstName", NULL, "lastName") FROM "Users" WHERE "id" = "User"."id")  ILIKE :searchByName ` +
    `OR (SELECT CONCAT_WS(' ', "lastName", NULL, "firstName") FROM "Users" WHERE "id" = "User"."id")  ILIKE :searchByName `
  );

  const replacements = {};
  const where = {
    status: UserStatus.Confirmed,
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

    replacements['searchByName'] = `%${r.query.q}%`;
    where[Op.or].push(userSearchLiteral)
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    col: 'id',
    distinct: true,
    include,
    replacements,
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

  await userController.createRaiseView();

  await UserController.createProfileVisibility({ userId: user.id, role: r.payload.role });

  await UserStatisticController.addRoleAction(r.payload.role);

  return output();
}

export function editProfile(userRole: UserRole) {
  return async function (r) {
    const meUser: User = r.auth.credentials;

    if (userRole === UserRole.Worker) {
      const [editableUser, workerProfileVisibilitySetting, userSpecializations] = await new EditProfileComposHandler(r.server.app.db).Handle({
        profile: {
          user: meUser,
          editableRole: userRole,
          ...r.payload.profile,
        },
        secure: { totpCode: r.payload.totpCode },
      });

      await addUpdateReviewStatisticsJob({
        userId: meUser.id,
      });

      editableUser.setDataValue('userSpecializations', userSpecializations);
      editableUser.setDataValue('workerProfileVisibilitySetting', workerProfileVisibilitySetting);

      return output(editableUser);
    }
    if (userRole === UserRole.Employer) {
      const [editableUser, employerProfileVisibilitySetting] = await new EditProfileComposHandler(r.server.app.db).Handle({
        profile: {
          user: meUser,
          editableRole: userRole,
          ...r.payload.profile,
        },
        secure: { totpCode: r.payload.totpCode },
      });

      await addUpdateReviewStatisticsJob({
        userId: meUser.id,
      });

      editableUser.setDataValue('employerProfileVisibilitySetting', employerProfileVisibilitySetting);

      return output(editableUser);
    }
  };
}

export async function changePassword(r) {
  const meUser: User = r.auth.credentials;
  const mySession: Session = r.auth.artifacts.session;

  const { oldPassword, newPassword } = r.payload as { oldPassword: string, newPassword: string }

  await new ChangeUserPasswordComposHandler(r.server.app.db).Handle({
    oldPassword,
    newPassword,
    user: meUser,
    currentSession: mySession,
  });

  return output();
}

export async function confirmPhoneNumber(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);

  const userController = new UserOldController(user);

  await userController
    .userMustHaveVerificationPhone()
    .checkPhoneConfirmationCode(r.payload.confirmCode)
    .confirmPhoneNumber()

  await UserStatisticController.smsPassedAction();

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
  const meUser: User = r.auth.credentials;

  const { totp } = r.payload as{ totp: string }

  await new ChangeRoleComposHandler(r.server.app.db).Handle({
    user: meUser,
    code2FA: totp,
  })

  await deleteUserFiltersJob({
    userId: meUser.id
  });
  await addUpdateReviewStatisticsJob({
    userId: meUser.id,
  });
  await updateQuestsStatisticJob({
    userId: meUser.id,
    role: meUser.role,
  });
  await UserStatisticController.changeRoleAction(meUser.role);

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
