import * as fs from 'fs';
import * as path from 'path';
import { Op } from 'sequelize';
import * as querystring from 'querystring';
import config from '../config/config';
import { Errors } from '../utils/errors';
import converter from 'bech32-converting';
import { addSendEmailJob } from '../jobs/sendEmail';
import { generateJwt } from '../utils/auth';
import { UserController, UserOldController } from '../controllers/user/controller.user';
import { ChecksListUser } from '../checks-list/checksList.user';
import { totpValidate } from '@workquest/database-models/lib/utils';
import { createReferralProgramJob } from '../jobs/createReferralProgram';
import { UserControllerFactory } from '../factories/factory.userController';
import { error, getDevice, getGeo, getRandomHexToken, getRealIp, output } from '../utils';
import { LoginApp } from '@workquest/database-models/lib/models/user/types';
import { writeActionStatistics } from '../jobs/writeActionStatistics';
import {
  defaultUserSettings,
  Session,
  User,
  UsersPlatformStatisticFields,
  UserStatus,
  Wallet
} from '@workquest/database-models/lib/models';
import Handlebars = require('handlebars');


const confirmTemplatePath = path.join(__dirname, '..', '..', '..', 'templates', 'confirmEmail.html');

const confirmTemplate = Handlebars.compile(
  fs.readFileSync(confirmTemplatePath, {
    encoding: 'utf-8',
  }),
);

export function register(host: 'dao' | 'main') {
  return async function (r) {
    await UserOldController.checkEmail(r.payload.email);

    const emailConfirmCode = getRandomHexToken()
      .substring(0, 6)
      .toUpperCase()

    const emailConfirmLink = host === 'main'
      ? `${config.baseUrl}/sign-in?token=${emailConfirmCode}`
      : `${config.baseUrlDao}/sign-in?token=${emailConfirmCode}`

    const emailHtml = confirmTemplate({
      confirmLink: emailConfirmLink,
      confirmCode: emailConfirmCode,
    });

    await addSendEmailJob({
      email: r.payload.email,
      subject: 'Work Quest | Confirmation code',
      text:
        `Welcome to WorkQuest` +
        `${emailConfirmCode}\n` +
        `If it was not you, then change password to protect your account.\n` +
        'This email sent automatically, please do not reply to it.',
      html: emailHtml,
    });

    const user = await User.create({
      email: r.payload.email.toLowerCase(),
      password: r.payload.password,
      firstName: r.payload.firstName,
      lastName: r.payload.lastName,
      settings: {
        ...defaultUserSettings,
        emailConfirm: emailConfirmCode,
      },
    });

    await createReferralProgramJob({
      userId: user.id,
      referralId: r.payload.referralId,
    });

    const session = await Session.create({
      userId: user.id,
      invalidating: false,
      isTotpPassed: true,
      place: getGeo(r),
      ip: getRealIp(r),
      device: getDevice(r),
    });

    const result = {
      ...generateJwt({ id: session.id, userId: session.userId }),
      userStatus: user.status,
    };

    if (
      session.device.startsWith('Android') ||
      session.device.startsWith('iOS') ||
      session.device.startsWith('Dart')
    ) {
      await writeActionStatistics(UsersPlatformStatisticFields.UseApp, 'user');
    } else {
      await writeActionStatistics(UsersPlatformStatisticFields.UseWeb, 'user');
    }

    await Promise.all([
      writeActionStatistics(UsersPlatformStatisticFields.Registered, 'user'),
      writeActionStatistics(UsersPlatformStatisticFields.Unfinished, 'user'),
      writeActionStatistics(UsersPlatformStatisticFields.KycNotPassed, 'user'),
      writeActionStatistics(UsersPlatformStatisticFields.SmsNotPassed, 'user'),
    ]);

    return output(result);
  };
}

export function resendConfirmCodeEmail(host: 'dao' | 'main') {
  return async function (r) {
    const userController = await UserControllerFactory.createByIdWithPassword(r.auth.credentials.id);

    const userCheckList = new ChecksListUser(userController.user);

    const emailConfirmCode = getRandomHexToken()
      .substring(0, 6)
      .toUpperCase()

    const emailConfirmLink = host === 'main'
      ? `${ config.baseUrl }/sign-in?token=${ emailConfirmCode }`
      : `${ config.baseUrlDao }/sign-in?token=${ emailConfirmCode }`

    const emailHtml = confirmTemplate({
      confirmLink: emailConfirmLink,
      confirmCode: emailConfirmCode,
    });

    userCheckList
      .checkUserStatus(UserStatus.Unconfirmed)

    await userController.updateUserEmailConfirmCode(emailConfirmCode);

    await addSendEmailJob({
      email: r.payload.email,
      subject: 'Work Quest | Confirmation code',
      text:
        `Welcome to WorkQuest` +
        `${emailConfirmCode}\n` +
        `If it was not you, then change password to protect your account.\n` +
        'This email sent automatically, please do not reply to it.',
      html: emailHtml,
    });

    return output();
  }
}

export function getLoginViaSocialNetworkHandler(returnType: 'token' | 'redirect', platform: 'main' | 'dao') {
  return async function loginThroughSocialNetwork(r, h) {
    const profile = r.auth.credentials.profile;
    const { referralId } = r.auth.credentials.query;

    if (!profile.email) {
      return error(Errors.InvalidEmail, 'Field email was not returned', {});
    }

    const user = await UserOldController.getUserByNetworkProfile(r.auth.strategy, profile, referralId);
    const userController = new UserOldController(user);

    await writeActionStatistics(r.auth.strategy, 'user');

    const session = await Session.create({
      userId: user.id,
      invalidating: false,
      isTotpPassed: true,
      place: getGeo(r),
      ip: getRealIp(r),
      device: getDevice(r),
    });

    const result = {
      ...generateJwt({ id: session.id, userId: session.userId }),
      userStatus: user.status,
    };

    if (returnType === 'redirect') {
      const qs = querystring.stringify(result);

      await writeActionStatistics(UsersPlatformStatisticFields.UseWeb, 'user');

      return h.redirect(
        platform === 'main'
          ? config.baseUrl + '/sign-in?' + qs
          : config.baseUrlDao + '/sign-in?' + qs,
      );
    }

    await writeActionStatistics(UsersPlatformStatisticFields.UseApp, 'user');

    return output(result);
  };
}

export async function confirmEmail(r) {
  const { confirmCode, role } = r.payload;

  const userController = await UserControllerFactory.createByIdWithPassword(r.auth.credentials.id);
  const userCheckList = new ChecksListUser(userController.user);

  userCheckList
    .checkUserStatus(UserStatus.Unconfirmed)
    .checkEmailConfirmCode(confirmCode)

  await r.server.app.db.transaction(async (tx) => {
    await userController.createStatistics({ tx });

    if (role) {
      await userController.confirmUser(role, { tx });
      await UserController.createProfileVisibility({ userId: userController.user.id, role }, { tx });
    } else {
      await userController.confirmUserWithStatusNeedSetRole({ tx });
    }
  });

  await writeActionStatistics(UsersPlatformStatisticFields.Finished, 'user');

  return output({ status: userController.user.status });
}

export async function login(r) {
  const user = await User.scope('withPassword').findOne({
    where: { email: { [Op.iLike]: r.payload.email } },
    include: [
      {
        model: Wallet,
        as: 'wallet',
        required: false,
      },
    ],
  });
  const userController = new UserOldController(user);
  const userTotpActiveStatus: boolean = user.isTOTPEnabled();

  await userController.checkPassword(r.payload.password);

  const session = await Session.create({
    userId: user.id,
    invalidating: false,
    isTotpPassed: !userTotpActiveStatus,
    place: getGeo(r),
    ip: getRealIp(r),
    app: LoginApp.App,
    device: getDevice(r),
  });

  const result = {
    ...generateJwt({ id: session.id, userId: session.userId }),
    userStatus: user.status,
    totpIsActive: userTotpActiveStatus,
    address: user.wallet ? user.wallet.address : null,
  };

  if (
    session.device.startsWith('Android') ||
    session.device.startsWith('iOS') ||
    session.device.startsWith('Dart')
  ) {
    await writeActionStatistics(UsersPlatformStatisticFields.UseApp, 'user');
  } else {
    await writeActionStatistics(UsersPlatformStatisticFields.UseWeb, 'user');
  }

  return output(result);
}

export async function refreshTokens(r) {
  const newSession = await Session.create({
    userId: r.auth.credentials.id,
    invalidating: false,
    isTotpPassed: true,
    place: getGeo(r),
    ip: getRealIp(r),
    app: LoginApp.App,
    device: getDevice(r),
  });

  const result = {
    ...generateJwt({ id: newSession.id, userId: newSession.userId }),
    userStatus: r.auth.credentials.status,
  };

  if (
    newSession.device.startsWith('Android') ||
    newSession.device.startsWith('iOS') ||
    newSession.device.startsWith('Dart')
  ) {
    await writeActionStatistics(UsersPlatformStatisticFields.UseApp, 'user');
  } else {
    await writeActionStatistics(UsersPlatformStatisticFields.UseWeb, 'user');
  }

  return output(result);
}

export async function logout(r) {
  await Session.update(
    {
      invalidating: true,
      logoutAt: Date.now(),
    },
    {
      where: { id: r.auth.artifacts.sessionId },
    },
  );

  return output();
}

export async function registerWallet(r) {
  const { id } = r.auth.credentials;
  const { publicKey, address } = r.payload;

  const [_, isCreated] = await Wallet.findOrCreate({
    where: {
      [Op.or]: {
        userId: id,
        publicKey: publicKey.toLowerCase(),
        address: address.toLowerCase(),
      },
    },
    defaults: {
      userId: id,
      publicKey: publicKey.toLowerCase(),
      address: address.toLowerCase(),
    },
  });

  if (!isCreated) {
    return error(Errors.WalletExists, 'Wallet already exists', {});
  }

  const bech32Address = converter('eth').toBech32(address);

  return output({
    address,
    bech32Address,
  });
}

export async function loginWallet(r) {
  const address = r.payload.address.toLowerCase();
  const wallet = await Wallet.findOne({
    where: { address },
    include: [
      {
        model: User.unscoped(),
        as: 'user',
        attributes: ['id', 'status'],
      },
    ],
  });

  if (!wallet) {
    return error(Errors.NotFound, 'Wallet not found', { field: ['address'] });
  }

  const user = await User.scope('withPassword').findByPk(wallet.userId);
  const userTotpActiveStatus: boolean = user.settings.security.TOTP.active;

  const decryptedSignAddress = r.server.app.web3.eth.accounts.recover(address, '0x' + r.payload.signature);

  if (wallet.address.toLowerCase() !== decryptedSignAddress.toLowerCase()) {
    return error(Errors.NotFound, 'Wallet not found', {});
  }

  const session = await Session.create({
    userId: wallet.user.id,
    invalidating: false,
    place: getGeo(r),
    ip: getRealIp(r),
    device: getDevice(r),
    app: LoginApp.Wallet,
    isTotpPassed: !userTotpActiveStatus,
  });

  const result = {
    ...generateJwt({ id: session.id, userId: wallet.user.id }),
    totpIsActive: userTotpActiveStatus,
    userStatus: wallet.user.status,
    address: wallet.address,
    userId: user.id,
  };

  await writeActionStatistics(UsersPlatformStatisticFields.UseWallet, 'user');

  return output(result);
}

export async function validateUserPassword(r) {
  const userControllerFactory = await UserControllerFactory.createByIdWithPassword(r.auth.credentials.id);

  return output({
    isValid: await userControllerFactory.user.passwordCompare(r.payload.password),
  });
}

export async function validateUserTotp(r) {
  const userControllerFactory = await UserControllerFactory.createByIdWithPassword(r.auth.credentials.id);

  const isValid = userControllerFactory.user.isTOTPEnabled() ?
    totpValidate(r.payload.token, userControllerFactory.user.settings.security.TOTP.secret) : true;

  await Session.update({ isTotpPassed: isValid }, { where: { id: r.auth.artifacts.sessionId } });

  return output({ isValid });
}
