import { User } from "../models/User";
import { getRandomHexToken, output } from "../utils";
import { addSendEmailJob } from "../jobs/sendEmail";
import config from "../config/config";
import * as path from "path";
import * as fs from "fs";

const confirmTemplatePath = path.join(__dirname, "..", "..", "..", "templates", "resetPasswordConfirmation.html");
const confirmTemplate = Handlebars.compile(fs.readFileSync(confirmTemplatePath, {
  encoding: "utf-8"
}));

export async function sendCodeForRestorePassword(r) {
  const user = await User.findWithEmail(r.payload.email);

  if (user) {
    const emailRestorePasswordCode = getRandomHexToken();
    const emailRestorePasswordLink = `${config.baseUrl}/restore-password/set-password/?token=${emailRestorePasswordCode}`;

    const emailHtml = confirmTemplate({ confirmLink: emailRestorePasswordLink });
    await addSendEmailJob({
      email: r.payload.email,
      subject: "Work Quest | Reset password confirmation",
      text: `Change password. Follow this link ${emailRestorePasswordLink}`,
      html: emailHtml
    });

    await user.update({ settings: { ...user.settings, restorePassword: emailRestorePasswordCode } });
  }

  return output();
}

export async function setNewPassword(r) {
  const user = await User.scope("withPassword").findOne({
    where: {
      "settings.restorePassword": r.payload.token
    }
  });
  if (!user) return output();

  await user.update({ password: r.payload.newPassword , "settings.restorePassword": null });
  return output();
}
