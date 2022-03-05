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
  getReferralUserAffiliates,
  signReferralUserAffiliates,
  getReferralUserClaimedEvents
} from '../../api/referral';

export default [
  {
    method: 'GET',
    path: '/v1/user/me/referral-program/affiliates',
    handler: getReferralUserAffiliates,
    options: {
      auth: 'jwt-access',
      id: 'v1.referral-program.affiliates',
      tags: ['api', 'referral-program'],
      description: 'Get my affiliates',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema
        }).label('GetMyAffiliatesAndReferralInfo')
      },
      response: {
        schema: outputOkSchema(referralUserAffiliatesSchema)
          .label('getReferralUserAffiliatesResponse')
      }
    }
  }, {
    method: 'POST',
    path: '/v1/referral-program/affiliate/add',
    handler: signReferralUserAffiliates,
    options: {
      auth: 'jwt-access',
      id: 'v1.referral.addAffiliates',
      tags: ['api', 'referral-program'],
      description: 'Register new affiliate user',
      validate: {
        payload: Joi.object({
          affiliates: idsSchema.required()
        }).label('ReferralAddAffiliates')
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
