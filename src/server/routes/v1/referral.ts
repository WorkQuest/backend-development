import * as Joi from 'joi';
import * as handlers from '../../api/referral';
import {
  limitSchema,
  offsetSchema,
  referralSchema,
  outputOkSchema,
  accountAddressSchema,
  referralStatusSchema,
  outputPaginationSchema,
  accountAddressesSchema,
  referralProgramClaimedAndPaidEventSchema
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'GET',
  path: '/v1/user/me/referral-program/referrals',
  handler: handlers.getMyReferrals,
  options: {
    auth: 'jwt-access',
    id: 'v1.referralProgram.getMyReferrals',
    tags: ['api', 'referral-program'],
    description: 'Get my referrals',
    validate: {
      query: Joi.object({
        referralStatus: referralStatusSchema,
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetMyReferralsQuery')
    },
    response: {
      schema: outputPaginationSchema('referrals', referralSchema).label('GetMyReferralsResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/user/me/referral-program/referral/signature/created-referrals',
  handler: handlers.getMySignedCreatedReferrals,
  options: {
    auth: 'jwt-access',
    id: 'v1.referralProgram.getMySignedCreatedReferrals',
    tags: ['api', 'referral-program'],
    description: 'Get my signed created referrals',
    response: {
      schema: outputOkSchema(
        Joi.object({
          v: accountAddressSchema,
          r: accountAddressSchema,
          s: accountAddressSchema,
          addresses: accountAddressesSchema,
        }).label('SignedCreatedReferrals'),
      ).label('GetMySignedCreatedReferralsResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/user/me/referral-program/claimed-paid-events',
  handler: handlers.getMyReferralProgramClaimedAndPaidEvents,
  options: {
    auth: 'jwt-access',
    id: 'v1.referralProgram.getMyClaimedAndPaidEvents',
    tags: ['api', 'referral-program'],
    description: 'Get all paid and claimed events',
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetMyClaimedAndPaidEventsQuery')
    },
    response: {
      schema: outputOkSchema(
        outputPaginationSchema('events', referralProgramClaimedAndPaidEventSchema)
      ).label('GetMyClaimedAndPaidEventsResponse'),
    }
  }
}];
