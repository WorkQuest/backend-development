import * as Joi from "joi";
import { emailSchema, passwordSchema } from "../../schemes/user";
import { emptyOkSchema, hexTokenSchema } from "../../schemes";
import { sendCodeForRestorePassword, setNewPassword } from "../../api/restorePassword";

export default [{
  method: "POST",
  path: "/v1/restore-password/send-code",
  handler: sendCodeForRestorePassword,
  options: {
    id: "v1.restorePassword.sendCode",
    auth: false,
    tags: ["api", "restorePassword"],
    description: "Send password restore code on email",
    validate: {
      payload: Joi.object({
        email: emailSchema.required()
      }).label("SendCodeOnRestorePasswordPayload")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/restore-password/set-password",
  handler: setNewPassword,
  options: {
    id: "v1.restorePassword.setPassword",
    auth: false,
    tags: ["api", "restorePassword"],
    description: "Set new password using code from email",
    validate: {
      payload: Joi.object({
        newPassword: passwordSchema.required(),
        token: hexTokenSchema.required()
      }).label("SetPasswordPayload")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];
