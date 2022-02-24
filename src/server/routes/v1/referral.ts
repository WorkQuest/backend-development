import * as Joi from 'joi';
import {
  emptyOkSchema,
  outputOkSchema,
  tokensWithStatus
} from '@workquest/database-models/lib/schemes';
import { addAffiliates, myAffiliates } from '../../api/referral';
import {
  referralAddAffiliatesSchemas,
  referralAffiliatesSchema
} from '@workquest/database-models/lib/schemes/referral';

export default [
  {
    method: 'GET',
    path: '/v1/referral/affiliates',
    handler: myAffiliates,
    options: {
      auth: false,// jwt-access
      id: 'v1.myAffiliates',
      tags: ['api', 'referral'],
      description: 'Get my affiliates',
      response: {
        schema: emptyOkSchema
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
];
