import * as Joi from 'joi';
import * as handlers from '../../api/faucetWusdWqt';
import {
  outputPaginationSchema,
  referralSchema
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'GET',
  path: '/v1/user/me/faucet/coins',
  handler: handlers.getFaucetWusdWqt,
  options: {
    auth: 'jwt-access',
    id: 'v1.faucet.getFaucetWusdWqt',
    tags: ['api', 'faucet'],
    description: 'Get coins for testing from the faucet',
    response: {
      schema: outputPaginationSchema('referrals', referralSchema).label('GetFaucetWusdWqtResponse')
    }
  }
}]
