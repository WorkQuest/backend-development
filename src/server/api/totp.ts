import * as speakeasy from 'speakeasy';
import { getUUID, output } from '../utils';
import { addSendEmailJob } from '../jobs/sendEmail';
import * as path from 'path';
import * as fs from 'fs';
import Handlebars = require('handlebars');
import { Session, User } from "@workquest/database-models/lib/models";
import { UserOldController } from '../controllers/user/controller.user';
import { UserStatisticController } from '../controllers/statistic/controller.userStatistic';
import { UserControllerFactory } from "../factories/factory.userController";
import { totpValidate } from "@workquest/database-models/lib/utils";

const confirmTemplatePath = path.join(__dirname, '..', '..', '..', 'templates', 'confirm2FA.html');
const confirmTemplate = Handlebars.compile(
  fs.readFileSync(confirmTemplatePath, {
    encoding: 'utf-8',
  }),
);

export async function enableTOTP(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const userController = new UserOldController(user);

  await userController.userMustHaveActiveStatusTOTP(false);

  const { base32 } = speakeasy.generateSecret({ length: 10, name: 'WorkQuest' });
  const confirmCode = getUUID().substr(0, 6).toUpperCase();
  const emailHtml = confirmTemplate({ confirmCode });

  await userController.user.update({
    'settings.security.TOTP.confirmCode': confirmCode,
    'settings.security.TOTP.secret': base32,
  });

  await addSendEmailJob({
    email: userController.user.email,
    text:
      `Verification code to enable 2FA on your account\n`+
      `${confirmCode}\n` +
      `If it was not you, then change password to protect your account.\n` +
      `This email sent automatically, please do not reply to it.`,
    subject: 'WorkQuest | Google Authenticator confirmation',
    html: emailHtml,
  });

  await UserStatisticController.enableTOTPAction();

  return output(base32);
}

export async function confirmEnablingTOTP(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const userController = new UserOldController(user);

  await userController.userMustHaveActiveStatusTOTP(false);
  await userController.checkActivationCodeTotp(r.payload.confirmCode);
  await userController.checkTotpConfirmationCode(r.payload.totp);

  await user.update({
    'settings.security.TOTP.confirmCode': null,
    'settings.security.TOTP.active': true,
  });

  return output();
}

export async function disableTOTP(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const userController = new UserOldController(user);

  await userController
    .userMustHaveActiveStatusTOTP(true)
    .checkTotpConfirmationCode(r.payload.totp)

  await user.update({
    'settings.security.TOTP.active': false,
    'settings.security.TOTP.secret': null,
  });

  await UserStatisticController.disableTOTPAction();

  return output();
}

export async function validateTotp(r) {
  const userControllerFactory = await UserControllerFactory.createByIdWithPassword(r.auth.credentials.id);

  const isValid =
    userControllerFactory.user.isTOTPEnabled()
      ? totpValidate(r.payload.token, userControllerFactory.user.settings.security.TOTP.secret)
      : true

  return output({ isValid });
}
