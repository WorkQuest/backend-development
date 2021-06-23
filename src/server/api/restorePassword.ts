import { User } from '../models/User';
import { getRandomHexToken, output } from '../utils';
import { addSendEmailJob } from '../jobs/sendEmail';
import config from '../config/config';

export async function sendCodeForRestorePassword(r) {
  const user = await User.findWithEmail(r.payload.email);

  if (user) {
    const emailRestorePasswordCode = getRandomHexToken();
    const emailRestorePasswordLink = `${config.baseUrl}/restore-password/set-password/?token=${emailRestorePasswordCode}`;

    await addSendEmailJob({
      email: r.payload.email,
      text: 'Change password. Follow this link ' + emailRestorePasswordLink,
      subject: 'Work Quest',
      html: `<p>Восстановление пароля: ${emailRestorePasswordLink}</p>`,
    });
    await user.update({ settings: { ...user.settings, restorePassword: emailRestorePasswordCode } });
  }

  return output();
}

export async function setNewPassword(r) {
  const user = await User.scope("withPassword").findOne({
    where: {
      "settings.restorePassword": r.payload.restorePasswordCode
    }
  });
  if (!user) return output();

  await user.update({ password: r.payload.newPassword , "settings.restorePassword": null });
  return output();
}
