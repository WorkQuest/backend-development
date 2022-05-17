import * as Joi from 'joi';
import * as handlers from '../../api/auth';
import {
  idSchema,
  totpSchema,
  emptyOkSchema,
  hexTokenSchema,
  outputOkSchema,
  userRoleSchema,
  userEmailSchema,
  tokensWithStatus,
  userStatusSchema,
  userPasswordSchema,
  userLastNameSchema,
  userFirstNameSchema,
  walletAddressSchema,
  walletPublicKeySchema,
  walletSignatureSchema
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'POST',
    path: '/v1/auth/register',
    handler: handlers.register('main'),
    options: {
      auth: false,
      id: 'v1.auth.register',
      tags: ['api', 'auth'],
      description: 'Register new user',
      validate: {
        payload: Joi.object({
          firstName: userFirstNameSchema.required(),
          lastName: userLastNameSchema.required(),
          email: userEmailSchema.required(),
          password: userPasswordSchema.required(),
          referralId: idSchema.allow(null).default(null),
        }).label('AuthRegisterPayload'),
      },
      response: {
        schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse'),
      },
    },
  },
  ...[
    'dao',
    'main',
  ].map((platform: 'dao' | 'main')  => ({
    method: 'POST',
    path: `/v1/auth/${platform}/resend-email`,
    handler: handlers.resendConfirmCodeEmail(platform),
    options: {
      id: `v1.auth.${platform}.resendEmail`,
      tags: ['api', 'auth'],
      description: 'ResendEmail',
      validate: {
        payload: Joi.object({
          email: userEmailSchema.required(),
        }).label('ResendEmailPayload'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  })),
  {
    method: 'POST',
    path: '/v1/auth/dao/register',
    handler: handlers.register('dao'),
    options: {
      auth: false,
      id: 'v1.auth.register.dao',
      tags: ['api', 'auth'],
      description: 'Register new user on dao',
      validate: {
        payload: Joi.object({
          firstName: userFirstNameSchema.required(),
          lastName: userLastNameSchema.required(),
          email: userEmailSchema.required(),
          password: userPasswordSchema.required(),
          referralId: idSchema.allow(null).default(null),
        }).label('AuthRegisterPayload'),
      },
      response: {
        schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/auth/confirm-email',
    handler: handlers.confirmEmail,
    options: {
      auth: 'jwt-access',
      id: 'v1.auth.confirmEmail',
      tags: ['api', 'auth'],
      description: 'Confirm email',
      validate: {
        payload: Joi.object({
          confirmCode: hexTokenSchema.required(),
          role: userRoleSchema,
        }).label('AuthConfirmEmailPayload'),
      },
      response: {
        schema: outputOkSchema(userStatusSchema).label('UserStatus'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/auth/login',
    handler: handlers.login,
    options: {
      auth: false,
      id: 'v1.auth.login',
      tags: ['api', 'auth'],
      description: 'Login user',
      validate: {
        payload: Joi.object({
          email: userEmailSchema.required(),
          password: userPasswordSchema.required(),
        }).label('AuthLoginPayload'),
      },
      response: {
        schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/auth/refresh-tokens',
    handler: handlers.refreshTokens,
    options: {
      auth: 'jwt-refresh',
      id: 'v1.auth.refreshTokens',
      tags: ['api', 'auth'],
      description: 'Refresh auth tokens',
      response: {
        schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/auth/logout',
    handler: handlers.logout,
    options: {
      auth: 'jwt-access',
      id: 'v1.auth.logout',
      tags: ['api', 'auth'],
      description: 'Logout',
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/auth/register/wallet',
    handler: handlers.registerWallet,
    options: {
      auth: 'jwt-access',
      id: 'v1.auth.walletRegister',
      tags: ['api', 'auth'],
      description: 'Register wallet',
      validate: {
        payload: Joi.object({
          publicKey: walletPublicKeySchema.required(),
          address: walletAddressSchema.required(),
        }).label('RegisterWalletPayload'),
      },
      response: {
        schema: outputOkSchema(walletAddressSchema).label('RegisterWalletResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/auth/login/wallet',
    handler: handlers.loginWallet,
    options: {
      auth: false,
      id: 'v1.auth.walletLogin',
      tags: ['api', 'auth'],
      description: 'Login by wallet',
      validate: {
        payload: Joi.object({
          signature: walletSignatureSchema.required(),
          address: walletAddressSchema.required(),
        }).label('LoginByWalletPayload'),
      },
      response: {
        schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/auth/validate-password',
    handler: handlers.validateUserPassword,
    options: {
      auth: 'jwt-access',
      id: 'v1.auth.validatePassword',
      tags: ['api', 'auth'],
      description: 'Validate password',
      validate: {
        payload: Joi.object({
          password: userPasswordSchema.required(),
        }).label('ValidateUserPasswordPayload'),
      },
      response: {
        schema: outputOkSchema(
          Joi.object({
            isValid: Joi.boolean(),
          }).label('ValidateUserPasswordSchema'),
        ).label('ValidateUserPasswordResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/auth/validate-totp',
    handler: handlers.validateUserTotp,
    options: {
      auth: 'jwt-access',
      id: 'v1.auth.validateTotp',
      tags: ['api', 'auth'],
      description: 'Validate totp',
      validate: {
        payload: Joi.object({
          token: totpSchema.required(),
        }).label('ValidateUserTotpPayload'),
      },
      response: {
        schema: outputOkSchema(
          Joi.object({
            isValid: Joi.boolean(),
          }).label('ValidateUserTotp'),
        ).label('ValidateUserTotpResponse'),
      },
    },
  },
  ...[
    'google',
    'linkedin',
    'twitter',
    'facebook',
  ].map(strategy => (
    [
      'dao',
      'main',
    ].map((platform: 'dao' | 'main')  => ([{
      method: 'GET',
      path: `/v1/auth/login/${platform}/${strategy}`,
      handler: handlers.getLoginViaSocialNetworkHandler('redirect', platform),
      options: {
        auth: { strategy: strategy },
        id: `v1.auth.${platform}.login.${strategy}`,
        tags: ['api', 'auth'],
        description: `Login user through ${platform}`,
        response: {
          schema: emptyOkSchema,
        },
      },
    }, {
      method: 'GET',
      path: `/v1/auth/login/${platform}/${strategy}/token`,
      handler: handlers.getLoginViaSocialNetworkHandler('token', platform),
      options: {
        auth: { strategy: strategy },
        id: `v1.auth.${platform}.login.${strategy}Tokens`,
        tags: ['api', 'auth'],
        description: `Login user through ${platform} (returns tokens)`,
        response: {
          schema: outputOkSchema(tokensWithStatus).label('TokensWithStatusResponse'),
        },
      },
    }])))
  ).flat(2),
];
