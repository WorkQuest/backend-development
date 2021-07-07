import * as speakeasy from "speakeasy";
import { getUUID, output } from '../utils';
import { addSendEmailJob } from '../jobs/sendEmail';

export async function enableTOTP(r) {
  // const user = await User.scope('withPassword').findByPk(r.auth.credentials.id);
  const user = r.auth.credentials;

  user.mustHaveTOTP(true);

  const { base32 } = speakeasy.generateSecret({ length: 10, name: 'WorkQuest' });
  const confirmCode = getUUID().substr(0, 6).toUpperCase();
  const confirmLink = ''; // TODO

  await user.update( {
    "settings.security.confirmCodeOnEmailTOTP": confirmCode,
    "settings.security.TOTP": {
      secret: base32
    }
  });

  await addSendEmailJob({
    email: user.email,
    text: `Код подтверждения Google Authenticator: ${confirmCode}`,
    subject: 'Подтверждение Google Authenticator',
    html: ''
  });

  return output(base32);
}

export async function confirmEnablingTOPS(r) {
  const user = r.auth.credentials;

  if (user.security.confirmCodeOnEmailTOTP !== r.payload.confirmCode) {
    return output();
  }

  await user.update({
    "settings.security.confirmCodeOnEmailTOTP": null,
    "settings.security.TOTP.active": true,
  });

  return output();
}

export async function disableTOTP(r) {
  await r.auth.credentials.update({
    "settings.security.TOTP.active": false,
    "settings.security.TOTP.secret": null,
  });

  return output();
}
