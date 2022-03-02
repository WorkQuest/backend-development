import * as Joi from 'joi';
import {
  outputOkSchema,
  idsSchema,
  offsetSchema,
  limitSchema
} from '@workquest/database-models/lib/schemes';
import { addAffiliates, myAffiliates, referralRewardEvents } from '../../api/referral';

export default [
  {
    method: 'GET',
    path: '/v1/referral/{userId}',
    handler: myAffiliates,
    options: {
      auth: 'jwt-access',
      id: 'v1.referral.affiliates',
      tags: ['api', 'referral'],
      description: 'Get my affiliates',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema
        }).label('GetMyAffiliatesAndReferralInfo')
      },
      response: {
        schema: outputOkSchema
      }
    }
  }, {
    method: 'POST',
    path: '/v1/referral/addAffiliates',
    handler: addAffiliates,
    options: {
      auth: 'jwt-access',
      id: 'v1.referral.addAffiliates',
      tags: ['api', 'referral'],
      description: 'Register new affiliate user',
      validate: {
        payload: Joi.object({
          affiliates: idsSchema.required()
        }).label('ReferralAddAffiliates')
      },
      response: {
        schema: outputOkSchema
      }
    }
  }, {
    method: 'GET',
    path: '/v1/referral/claim/{userId}',
    handler: referralRewardEvents,
    options: {
      auth: 'jwt-access',
      id: 'v1.referral.affiliates',
      tags: ['api', 'referral'],
      description: 'Get all events paid or claimed',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema
        }).label('GetReferralRewardClaimEvents')
      },
      response: {
        schema: outputOkSchema
      }
    }
  }
];
