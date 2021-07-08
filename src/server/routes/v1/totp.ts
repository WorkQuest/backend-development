import * as Joi from 'joi';
import { disableTOTP, enableTOTP, confirmEnablingTOTP } from '../../api/totp';
import { emptyOkSchema, hexTokenSchema, outputOkSchema, totpSchema } from '../../schemes';

export default [{
  method: "POST",
  path: "/v1/totp/enable",
  handler: enableTOTP,
  options: {
    id: "v1.totp.enable",
    tags: ["api", "TOTP"],
    description: "Enable 2FA",
    response: {
      schema: outputOkSchema(totpSchema).label("EnableTotpResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/totp/disable",
  handler: disableTOTP,
  options: {
    id: "v1.totp.disable",
    tags: ["api", "TOTP"],
    description: "Disable 2FA",
    validate: {
      payload: Joi.object({
        totp: totpSchema.required()
      }).label("DisableTotpPayload")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/totp/confirm",
  handler: confirmEnablingTOTP,
  options: {
    id: "v1.totp.confirm",
    tags: ["api", "TOTP"],
    description: "confirm enabling 2FA",
    validate: {
      payload: Joi.object({
        confirmCode: hexTokenSchema.required(),
      }).label("ConfirmTotpPayload"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}]
