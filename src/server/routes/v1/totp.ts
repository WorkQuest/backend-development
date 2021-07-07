import { disableTOTP, enableTOTP, confirmEnablingTOPS } from '../../api/totp';
import { emptyOkSchema, outputOkSchema, totpSchema } from '../../schemes';

export default [{
  method: "POST",
  path: "/v1/totp/enable",
  handler: enableTOTP,
  options: {
    id: "v1.totp.enable",
    tags: ["api", "TOTP"],
    description: "Enable 2FA",
    response: {
      schema: outputOkSchema(totpSchema).label("EnableTotpPayload")
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
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/totp/confirm-enabling",
  handler: confirmEnablingTOPS,
  options: {
    id: "v1.totp.confirmEnabling",
    tags: ["api", "TOTP"],
    description: "confirm enabling 2FA",
    response: {
      schema: emptyOkSchema
    }
  }
}]
