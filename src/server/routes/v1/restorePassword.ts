import * as Joi from 'joi';
import { emptyOkSchema, longHexTokenSchema, userEmailSchema, userPasswordSchema } from '@workquest/database-models/lib/schemes';
import { sendCodeForRestorePassword, setNewPassword } from '../../api/restorePassword';

export default [
  {
    method: 'POST',
    path: '/v1/restore-password/send-code',
    handler: sendCodeForRestorePassword,
    options: {
      id: 'v1.restorePassword.sendCode',
      auth: false,
      tags: ['api', 'restorePassword'],
      description: 'Send password restore code on email',
      validate: {
        payload: Joi.object({
          email: userEmailSchema.required(),
        }).label('SendCodeOnRestorePasswordPayload'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/restore-password/set-password',
    handler: setNewPassword,
    options: {
      id: 'v1.restorePassword.setPassword',
      auth: false,
      tags: ['api', 'restorePassword'],
      description: 'Set new password using code from email',
      validate: {
        payload: Joi.object({
          newPassword: userPasswordSchema.required(),
          token: longHexTokenSchema.required(),
        }).label('SetPasswordPayload'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
];
