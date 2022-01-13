import * as Joi from "joi";
import {
  confirmEmail,
  getLoginViaSocialNetworkHandler,
  login, loginWallet,
  logout,
  refreshTokens,
  register,
  registerWallet, validateUserPassword
} from "../../api/auth";
import {
  outputOkSchema,
  userEmailSchema,
  userFirstNameSchema,
  userLastNameSchema,
  userPasswordSchema,
  walletAddressSchema,
  walletPublicKeySchema,
  walletSignatureSchema,
  userRoleSchema,
  userStatusSchema,
  emptyOkSchema,
  hexTokenSchema,
  tokensWithStatus,
  totpSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "POST",
  path: "/v1/auth/register",
  handler: register('main'),
  options: {
    auth: false,
    id: "v1.auth.register",
    tags: ["api", "auth"],
    description: "Register new user",
    validate: {
      payload: Joi.object({
        firstName: userFirstNameSchema.required(),
        lastName: userLastNameSchema.required(),
        email: userEmailSchema.required(),
        password: userPasswordSchema.required()
      }).label("AuthRegisterPayload")
    },
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/dao/register",
  handler: register('dao'),
  options: {
    auth: false,
    id: "v1.auth.register.dao",
    tags: ["api", "auth"],
    description: "Register new user on dao",
    validate: {
      payload: Joi.object({
        firstName: userFirstNameSchema.required(),
        lastName: userLastNameSchema.required(),
        email: userEmailSchema.required(),
        password: userPasswordSchema.required()
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
        role: userRoleSchema
      }).label("AuthConfirmEmailPayload")
    },
    response: {
      schema: outputOkSchema(userStatusSchema).label("UserStatus")
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
        email: userEmailSchema.required(),
        password: userPasswordSchema.required(),
        totp: totpSchema
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
      schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse')
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
      schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse')
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
      schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse')
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
      schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/refresh-tokens",
  handler: refreshTokens,
  options: {
    auth: "jwt-refresh",
    id: "v1.auth.refreshTokens",
    tags: ["api", "auth"],
    description: "Refresh auth tokens",
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/logout",
  handler: logout,
  options: {
    auth: 'jwt-access',
    id: "v1.auth.logout",
    tags: ["api", "auth"],
    description: "Logout",
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: 'POST',
  path: '/v1/auth/register/wallet',
  handler: registerWallet,
  options: {
    auth: 'jwt-access',
    id: 'v1.auth.walletRegister',
    tags: ['api', 'auth'],
    description: 'Register wallet',
    validate: {
      payload: Joi.object({
        publicKey: walletPublicKeySchema.required(),
        address: walletAddressSchema.required()
      }).label('RegisterWalletPayload')
    },
    response: {
      schema: outputOkSchema(walletAddressSchema).label('RegisterWalletResponse')
    }
  }
}, {
  method: 'POST',
  path: '/v1/auth/login/wallet',
  handler: loginWallet,
  options: {
    auth: false,
    id: 'v1.auth.walletLogin',
    tags: ['api', 'auth'],
    description: 'Login by wallet',
    validate: {
      payload: Joi.object({
        signature: walletSignatureSchema.required(),
        address: walletAddressSchema.required()
      }).label('LoginByWalletPayload')
    },
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
}, {
  method: 'POST',
  path: '/v1/auth/validate-password',
  handler: validateUserPassword,
  options: {
    auth: 'jwt-access',
    id: 'v1.auth.validatePassword',
    tags: ['api', 'auth'],
    description: 'Validate password',
    validate: {
      payload: Joi.object({
        password: userPasswordSchema.required()
      }).label('ValidateUserPasswordPayload')
    },
    response: {
      schema: outputOkSchema(Joi.object({
        isValid: Joi.boolean()
      }).label('ValidateUserPasswordSchema')
      ).label('ValidateUserPasswordResponse')
    }
  }
}];
