import * as Joi from "joi";
import { confirmEmail, login, register } from "../../api/auth";
import { emailSchema, firstNameSchema, lastNameSchema, passwordSchema, userRoleSchema } from "../../schemes/user";
import { emptyOkSchema, hexTokenSchema, jwtTokens, outputOkSchema } from "../../schemes";
import { UserRole } from "../../models/User";

export default [{
  method: "POST",
  path: "/v1/auth/register",
  handler: register,
  options: {
    auth: false,
    id: "v1.auth.register",
    tags: ["api", "auth"],
    description: "Register new user",
    validate: {
      payload: Joi.object({
        firstName: firstNameSchema,
        lastName: lastNameSchema,
        email: emailSchema,
        password: passwordSchema,
        role: userRoleSchema.default(UserRole.Worker)
      }).label("AuthRegisterPayload")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/confirm-email",
  handler: confirmEmail,
  options: {
    auth: false,
    id: "v1.auth.confirmEmail",
    tags: ["api", "auth"],
    description: "Confirm email",
    validate: {
      payload: Joi.object({
        confirmCode: hexTokenSchema
      }).label("AuthConfirmEmailPayload")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/login",
  handler: login,
  options: {
    auth: false,
    id: "v1.auth.login",
    tags: ["api", "auth"],
    description: "Login user",
    validate: {
      payload: Joi.object({
        email: emailSchema,
        password: passwordSchema
      }).label("AuthLoginPayload")
    },
    response: {
      schema: outputOkSchema(jwtTokens).label("AuthLoginResponse")
    }
  }
}];
