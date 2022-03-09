import * as Joi from 'joi';
import {
  outputOkSchema,
  idsSchema,
  offsetSchema,
  limitSchema,
  referralUserAffiliatesSchema,
  referralProgramUserAffiliatesScheme,
  referralProgramUsersClaimedEventsScheme
} from '@workquest/database-models/lib/schemes';
import {
  getAffiliateUserReferrals,
  signAffiliateUserReferrals,
  getReferralUserClaimedEvents
} from '../../api/referral';

export default [
  {
    method: 'GET',
    path: '/v1/user/me/referral-program/referrals',
    handler: getAffiliateUserReferrals,
    options: {
      auth: 'jwt-access',
      id: 'v1.referral-program.referrals',
      tags: ['api', 'referral-program'],
      description: 'Get my referrals',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema
        }).label('GetMyReferralsAndReferralInfo')
      },
      response: {
        schema: outputOkSchema(referralUserReferralsSchema)
          .label('getAffiliateUserReferralsResponse')
      }
    }
  }, {
    method: 'GET',
    path: '/v1/referral-program/referrals/add',
    handler: signAffiliateUserReferrals,
    options: {
      auth: 'jwt-access',
      id: 'v1.referral.addReferrals',
      tags: ['api', 'referral-program'],
      description: 'Register new referrals user',
      validate: {
        payload: Joi.object({
          referrals: idsSchema.required()
        }).label('ReferralAddReferrals')
      },
      response: {
        schema: outputOkSchema(referralProgramUserAffiliatesScheme)
          .label('SignReferralUserAffiliatesResponse')
      }
    }
  }, {
    method: 'GET',
    path: '/v1/user/me/referral-program/affiliate/claimed-events',
    handler: getReferralUserClaimedEvents,
    options: {
      auth: 'jwt-access',
      id: 'v1.referral.claim',
      tags: ['api', 'referral-program'],
      description: 'Get all events paid or claimed',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema
        }).label('GetReferralRewardClaimEvents')
      },
      response: {
        schema: outputOkSchema(referralProgramUsersClaimedEventsScheme)
          .label('referralProgramUsersClaimedEventsResponse')
      }
    }
  }
];
