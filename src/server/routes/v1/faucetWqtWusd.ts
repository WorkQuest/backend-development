import { emptyOkSchema } from '@workquest/database-models/lib/schemes';
import * as handlers from '../../api/faucetWqtWusd';

export default [{
  method: 'GET',
  path: '/v1/user/me/faucet/wusd',
  handler: handlers.sendFaucetWusd,
  options: {
    auth: 'jwt-access',
    id: 'v1.faucet.getFaucetWusd',
    tags: ['api', 'faucet'],
    description: 'Get coins for testing from the faucet',
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: 'GET',
  path: '/v1/user/me/faucet/wqt',
  handler: handlers.sendFaucetWqt,
  options: {
    auth: 'jwt-access',
    id: 'v1.faucet.getFaucetWqt',
    tags: ['api', 'faucet'],
    description: 'Get coins for testing from the faucet',
    response: {
      schema: emptyOkSchema
    }
  }
}];
