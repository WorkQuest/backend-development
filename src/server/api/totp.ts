import * as speakeasy from "speakeasy";
import { error, getUUID, output } from '../utils';
import { addSendEmailJob } from '../jobs/sendEmail';
import { Errors } from '../utils/errors';
import { User } from '../models/User';
import * as path from "path";
import * as fs from "fs";

const confirmTemplatePath = path.join(__dirname, "..", "..", "..", "templates", "confirm2FA.html");
const confirmTemplate = Handlebars.compile(fs.readFileSync(confirmTemplatePath, {
  encoding: "utf-8"
}));

export async function enableTOTP(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);

  user.mustHaveActiveStatusTOTP(false);

  const { base32 } = speakeasy.generateSecret({ length: 10, name: 'WorkQuest' });
  const confirmCode = getUUID().substr(0, 6).toUpperCase();
  const emailHtml = confirmTemplate({ confirmCode });

  await user.update( {
    "settings.security.TOTP.confirmCode": confirmCode,
    "settings.security.TOTP.secret": base32,
  });


  await addSendEmailJob({
    email: user.email,
    text: `Confirmation code Google Authenticator: ${confirmCode}`,
    subject: 'Confirmation Google Authenticator',
    html: emailHtml
  });

  return output(base32);
}

export async function confirmEnablingTOTP(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);

  user.mustHaveActiveStatusTOTP(false);

  if (user.settings.security.TOTP.confirmCode !== r.payload.confirmCode) {
    return error(Errors.Forbidden, "Confirmation code is not correct", {});
  }

  await user.update({
    "settings.security.TOTP.confirmCode": null,
    "settings.security.TOTP.active": true,
  });

  return output();
}

export async function disableTOTP(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);

  user.mustHaveActiveStatusTOTP(true);
  user.validateTOTP(r.payload.totp);

  await user.update({
    "settings.security.TOTP.active": false,
    "settings.security.TOTP.secret": null,
  });

  return output();
}
