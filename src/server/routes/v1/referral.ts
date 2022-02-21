import * as Joi from 'joi';
import {
  idSchema,
  emptyOkSchema
} from '@workquest/database-models/lib/schemes';
import { referral } from '../../api/referral';
import { output } from '../../utils';

export default [
  {
    method: 'GET',
    path: '/v1/referral/{userId}',
    handler: referral,
    options: {
      auth: false,// jwt-access
      id: 'v1.getReferral',
      tags: ['api', 'referral'],
      description: 'Get my referral',
      validate: {
        query: Joi.object({
          user: idSchema.required(),
        }).label('getReferral'),
      },
      response: {
        schema: emptyOkSchema
      },
    },
  },
];
