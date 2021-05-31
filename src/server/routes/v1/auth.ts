import * as Joi from "joi";
import { confirmEmail, getLoginViaSocialNetworkHandler, login, refreshTokens, register } from "../../api/auth";
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
  method: "GET",
  path: "/v1/auth/login/facebook",
  handler: getLoginViaSocialNetworkHandler("redirect"),
  options: {
    auth: {
      strategy: "facebook"
    },
    id: "v1.auth.login.facebook",
    tags: ["api", "auth"],
    description: "Login user through Facebook",
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "GET",
  path: "/v1/auth/login/google",
  handler: getLoginViaSocialNetworkHandler("redirect"),
  options: {
    auth: {
      strategy: "google"
    },
    id: "v1.auth.login.google",
    tags: ["api", "auth"],
    description: "Login user through Google",
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "GET",
  path: "/v1/auth/login/linkedin",
  handler: getLoginViaSocialNetworkHandler("redirect"),
  options: {
    auth: {
      strategy: "linkedin"
    },
    id: "v1.auth.login.linkedin",
    tags: ["api", "auth"],
    description: "Login user through Linkedin",
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "GET",
  path: "/v1/auth/login/twitter",
  handler: getLoginViaSocialNetworkHandler("redirect"),
  options: {
    auth: {
      strategy: "twitter"
    },
    id: "v1.auth.login.twitter",
    tags: ["api", "auth"],
    description: "Login user through Twitter",
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "GET",
  path: "/v1/auth/login/facebook/token",
  handler: getLoginViaSocialNetworkHandler("token"),
  options: {
    auth: {
      strategy: "facebook"
    },
    id: "v1.auth.login.facebookTokens",
    tags: ["api", "auth"],
    description: "Login user through Facebook (returns tokens)",
    response: {
      schema: tokensWithStatus
    }
  }
}, {
  method: "GET",
  path: "/v1/auth/login/google/token",
  handler: getLoginViaSocialNetworkHandler("token"),
  options: {
    auth: {
      strategy: "google"
    },
    id: "v1.auth.login.googleTokens",
    tags: ["api", "auth"],
    description: "Login user through Google (returns tokens)",
    response: {
      schema: tokensWithStatus
    }
  }
}, {
  method: "GET",
  path: "/v1/auth/login/linkedin/token",
  handler: getLoginViaSocialNetworkHandler("token"),
  options: {
    auth: {
      strategy: "linkedin"
    },
    id: "v1.auth.login.linkedinTokens",
    tags: ["api", "auth"],
    description: "Login user through Linkedin (returns tokens)",
    response: {
      schema: tokensWithStatus
    }
  }
}, {
  method: "GET",
  path: "/v1/auth/login/twitter/token",
  handler: getLoginViaSocialNetworkHandler("token"),
  options: {
    auth: {
      strategy: "twitter"
    },
    id: "v1.auth.login.twitterTokens",
    tags: ["api", "auth"],
    description: "Login user through Twitter (returns tokens)",
    response: {
      schema: tokensWithStatus
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
