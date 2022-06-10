import { outputOkSchema } from '@workquest/database-models/lib/schemes';
import * as handlers from '../../api/faucetWqtWusd';

export default [{
  method: 'GET',
  path: '/v1/user/me/faucet/wusd',
  handler: handlers.sentFaucetWusd,
  options: {
    auth: 'jwt-access',
    id: 'v1.faucet.getFaucetWusd',
    tags: ['api', 'faucet'],
    description: 'Get coins for testing from the faucet',
    response: {
      schema: outputOkSchema
    }
  }
}, {
  method: 'GET',
  path: '/v1/user/me/faucet/wqt',
  handler: handlers.sentFaucetWqt,
  options: {
    auth: 'jwt-access',
    id: 'v1.faucet.getFaucetWqt',
    tags: ['api', 'faucet'],
    description: 'Get coins for testing from the faucet',
    response: {
      schema: outputOkSchema
    }
  }
}];
