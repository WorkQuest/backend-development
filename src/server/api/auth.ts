import * as path from 'path';
import * as fs from 'fs';
import * as querystring from 'querystring';
import Handlebars = require('handlebars');
import { Op } from 'sequelize';
import config from '../config/config';
import { Errors } from '../utils/errors';
import { addSendEmailJob } from '../jobs/sendEmail';
import { generateJwt } from '../utils/auth';
import { UserController } from '../controllers/user/controller.user';
import converter from 'bech32-converting';
import { error, output, getGeo, getRealIp, getDevice, getRandomHexToken } from '../utils';
import {
  User,
  Wallet,
  Session,
  UserStatus,
  defaultUserSettings,
} from '@workquest/database-models/lib/models';
import { totpValidate } from '@workquest/database-models/lib/utils';

const confirmTemplatePath = path.join(__dirname, '..', '..', '..', 'templates', 'confirmEmail.html');
const confirmTemplate = Handlebars.compile(
  fs.readFileSync(confirmTemplatePath, {
    encoding: 'utf-8',
  }),
);

export function register(host: 'dao' | 'main') {
  return async function (r) {
    await UserController.checkEmail(r.payload.email);

    const emailConfirmCode = getRandomHexToken().substring(0, 6).toUpperCase();
    const emailConfirmLink =
      host === 'main' ? `${config.baseUrl}/confirm?token=${emailConfirmCode}` : `${config.baseUrlDao}/confirm?token=${emailConfirmCode}`;
    const emailHtml = confirmTemplate({
      confirmLink: emailConfirmLink,
      confirmCode: emailConfirmCode,
    });

    await addSendEmailJob({
      email: r.payload.email,
      subject: 'Work Quest | Confirmation code',
      text: `Your confirmation code is ${emailConfirmCode}. Follow this link ${config.baseUrl}/confirm?token=${emailConfirmCode}`,
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

    return output(result);
  };
}

export function getLoginViaSocialNetworkHandler(returnType: 'token' | 'redirect') {
  return async function loginThroughSocialNetwork(r, h) {
    const profile = r.auth.credentials.profile;

    if (!profile.email) {
      return error(Errors.InvalidEmail, 'Field email was not returned', {});
    }

    const user = await UserController.getUserByNetworkProfile(r.auth.strategy, profile);
    const userController = new UserController(user);
    await userController.createRaiseView();

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
      return h.redirect(
        // config.baseUrl TODO для тестов
        'http://localhost:3000' + '/sign-in?' + qs
      );
    }
    return output(result);
  };
}

export async function confirmEmail(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const userController = new UserController(user);

  await userController.checkUserAlreadyConfirmed().checkUserConfirmationCode(r.payload.confirmCode).createRaiseView();

  await UserController.createStatistics(user.id);

  if (r.payload.role) {
    await user.update({
      role: r.payload.role,
      status: UserStatus.Confirmed,
      'settings.emailConfirm': null,
      additionalInfo: UserController.getDefaultAdditionalInfo(r.payload.role),
    });
  } else {
    await user.update({
      status: UserStatus.NeedSetRole,
      'settings.emailConfirm': null,
    });
  }

  return output({ status: user.status });
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
  const userController = new UserController(user);
  const userTotpActiveStatus: boolean = user.isTOTPEnabled();

  await userController.checkPassword(r.payload.password);

  const session = await Session.create({
    userId: user.id,
    invalidating: false,
    isTotpPassed: !userTotpActiveStatus,
    place: getGeo(r),
    ip: getRealIp(r),
    device: getDevice(r),
  });

  const result = {
    ...generateJwt({ id: session.id, userId: session.userId }),
    userStatus: user.status,
    totpIsActive: userTotpActiveStatus,
    address: user.wallet ? user.wallet.address : null,
  };

  return output(result);
}

export async function refreshTokens(r) {
  const newSession = await Session.create({
    userId: r.auth.credentials.id,
    invalidating: false,
    isTotpPassed: true,
    place: getGeo(r),
    ip: getRealIp(r),
    device: getDevice(r),
  });

  const result = {
    ...generateJwt({ id: newSession.id, userId: newSession.userId }),
    userStatus: r.auth.credentials.status,
  };

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
  const user = await User.scope('withPassword').findByPk(wallet.userId);
  const userTotpActiveStatus: boolean = user.settings.security.TOTP.active;

  if (!wallet) {
    return error(Errors.NotFound, 'Wallet not found', { field: ['address'] });
  }

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
    isTotpPassed: !userTotpActiveStatus,
  });

  const result = {
    ...generateJwt({ id: session.id, userId: wallet.user.id }),
    totpIsActive: userTotpActiveStatus,
    userStatus: wallet.user.status,
    address: wallet.address,
  };

  return output(result);
}

export async function validateUserPassword(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);

  return output({
    isValid: await user.passwordCompare(r.payload.password),
  });
}

export async function validateUserTotp(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);

  const isValid = user.isTOTPEnabled() ?
    totpValidate(r.payload.token, user.settings.security.TOTP.secret) : true;

  await Session.update({ isTotpPassed: isValid }, { where: { id: r.auth.artifacts.sessionId } });

  return output({ isValid });
}
