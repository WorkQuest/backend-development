import * as Joi from 'joi';
import {
  idSchema,
  outputOkSchema
} from '@workquest/database-models/lib/schemes';
import { addAffiliates, myAffiliates } from '../../api/referral';
import {
  referralAffiliatesSchema,
  referralAddAffiliatesSchemas
} from '@workquest/database-models/lib/schemes/referral';

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
        params: Joi.object({
          userId: idSchema.required()
        }).label('GetAffiliatesParams')
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
          affiliates: referralAffiliatesSchema.required()
        }).label('ReferralAddAffiliates')
      },
      response: {
        schema: outputOkSchema(referralAddAffiliatesSchemas).label('ReferralAddAffiliates')
      }
    }
  }
  // , {
  //   method: 'GET',
  //   path: '/v1/referral/rewards',
  //   handler: referralRewardEvents,
  //   options: {
  //     auth: false,// jwt-access
  //     id: 'v1.referral.rewards',
  //     tags: ['api', 'referral'],
  //     description: 'Get all events in my rewards',
  //     validate: {
  //       params: Joi.object({
  //         userId: idSchema.required()
  //       }).label('GetEventsReferralParams')
  //     },
  //     response: {
  //       schema: outputOkSchema
  //     }
  //   }
  // }
];
