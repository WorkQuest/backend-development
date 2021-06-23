import * as Joi from 'joi';
import { emailSchema, passwordSchema } from '../../schemes/user';
import { emptyOkSchema, hexTokenSchema } from '../../schemes';
import { sendCodeForRestorePassword, setNewPassword } from '../../api/restorePassword';

export default [{
  method: "POST",
  path: "/v1/restore-password/send-code",
  handler: sendCodeForRestorePassword,
  options: {
    id: "v1.restorePassword.sendCode",
    auth: false,
    validate: {
      payload: Joi.object({
        email: emailSchema.required()
      }).label('RestorePasswordPayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/restore-password/set-password/{token}",
  handler: setNewPassword,
  options: {
    id: "v1.restorePassword.setPassword",
    auth: false,
    validate: {
      payload: Joi.object({
        newPassword: passwordSchema.required(),
        restorePasswordCode: hexTokenSchema.required(),
      }).label('RestorePasswordPayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];
