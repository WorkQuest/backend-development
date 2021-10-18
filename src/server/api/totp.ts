import * as speakeasy from "speakeasy";
import { getUUID, output } from "../utils";
import { addSendEmailJob } from "../jobs/sendEmail";
import * as path from "path";
import * as fs from "fs";
import Handlebars = require("handlebars");
import { User } from "@workquest/database-models/lib/models";
import { UserController } from "../controllers/user";

const confirmTemplatePath = path.join(__dirname, "..", "..", "..", "templates", "confirm2FA.html");
const confirmTemplate = Handlebars.compile(fs.readFileSync(confirmTemplatePath, {
  encoding: "utf-8"
}));

export async function enableTOTP(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const userController = new UserController(user.id, user);

  await userController.userMustHaveActiveStatusTOTP(false);

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
    subject: "WorkQuest | Google Authenticator confirmation",
    html: emailHtml
  });

  return output(base32);
}

export async function confirmEnablingTOTP(r) {
  const user = await User.scope("withPassword").findByPk(r.auth.credentials.id);
  const userController = new UserController(user.id, user);

  await userController.userMustHaveActiveStatusTOTP(false);
  await userController.checkActivationCodeTotp(r.payload.confirmCode);
  await userController.checkTotpConfirmationCode(r.payload.totp);

  await user.update({
    "settings.security.TOTP.confirmCode": null,
    "settings.security.TOTP.active": true
  });

  return output();
}

export async function disableTOTP(r) {
  const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const userController = new UserController(user.id, user);

  await userController.userMustHaveActiveStatusTOTP(false);
  await userController.checkTotpConfirmationCode(r.payload.totp);

  await user.update({
    "settings.security.TOTP.active": false,
    "settings.security.TOTP.secret": null,
  });

  return output();
}
