import * as Joi from "joi";
import { confirmEmail, login, refreshTokens, register } from "../../api/auth";
import { emailSchema, firstNameSchema, lastNameSchema, passwordSchema, userRoleSchema } from "../../schemes/user";
import { emptyOkSchema, hexTokenSchema, jwtTokens, outputOkSchema, tokensWithStatus } from "../../schemes";

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
        firstName: firstNameSchema.required(),
        lastName: lastNameSchema.required(),
        email: emailSchema.required(),
        password: passwordSchema.required()
      }).label("AuthRegisterPayload")
    },
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/confirm-email",
  handler: confirmEmail,
  options: {
    auth: 'jwt-access',
    id: "v1.auth.confirmEmail",
    tags: ["api", "auth"],
    description: "Confirm email",
    validate: {
      payload: Joi.object({
        confirmCode: hexTokenSchema.required(),
        role: userRoleSchema.required()
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
        email: emailSchema.required(),
        password: passwordSchema.required()
      }).label("AuthLoginPayload")
    },
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/refresh-tokens",
  handler: refreshTokens,
  options: {
    id: "v1.auth.refreshTokens",
    tags: ["api", "auth"],
    description: "Refresh auth tokens",
    response: {
      schema: outputOkSchema(jwtTokens).label("AuthRefreshTokensResponse")
    }
  }
}];
