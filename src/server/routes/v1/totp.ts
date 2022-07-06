import * as Joi from 'joi';
import { emptyOkSchema, hexTokenSchema, outputOkSchema, totpSchema } from '@workquest/database-models/lib/schemes';
import * as handlers from "../../api/totp";

export default [
  {
    method: 'POST',
    path: '/v1/totp/enable',
    handler: handlers.enableTOTP,
    options: {
      auth: 'jwt-access',
      id: 'v1.totp.enable',
      tags: ['api', 'TOTP'],
      description: 'Enable 2FA',
      response: {
        schema: outputOkSchema(totpSchema).label('TotpResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/totp/disable',
    handler: handlers.disableTOTP,
    options: {
      auth: 'jwt-access',
      id: 'v1.totp.disable',
      tags: ['api', 'TOTP'],
      description: 'Disable 2FA',
      validate: {
        payload: Joi.object({
          totp: totpSchema.required(),
        }).label('DisableTotpPayload'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/totp/confirm',
    handler: handlers.confirmEnablingTOTP,
    options: {
      auth: 'jwt-access',
      id: 'v1.totp.confirm',
      tags: ['api', 'TOTP'],
      description: 'confirm enabling 2FA',
      validate: {
        payload: Joi.object({
          confirmCode: hexTokenSchema.required(),
          totp: totpSchema.required(),
        }).label('ConfirmTotpPayload'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/auth/session/current/validate-totp',
    handler: handlers.currentSessionValidateTotp,
    options: {
      auth: 'jwt-access',
      id: 'v1.auth.session.current.activeByTotp',
      tags: ['api', 'auth'],
      description: 'Validate totp for current session',
      validate: {
        payload: Joi.object({
          token: totpSchema.required(),
        }).label('ValidateUserCurrentSessionTotpPayload'),
      },
      response: {
        schema: outputOkSchema(
          Joi.object({
            isValid: Joi.boolean(),
          }).label('ValidateUserTotp'),
        ).label('ValidateUserCurrentSessionTotpResponse'),
      },
    },
  }, {
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
];
