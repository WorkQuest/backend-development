import { sentFaucetWqt, sentFaucetWusd } from '../../api/fausetWusdWqt';
import {
  outputPaginationSchema,
  faucetSendWusdWqtResponseSchemas
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'GET',
  path: '/v1/user/me/faucet/wusd',
  handler: sentFaucetWusd,
  options: {
    auth: 'jwt-access',
    id: 'v1.faucet.getFaucetWusd',
    tags: ['api', 'faucet'],
    description: 'Get coins for testing from the faucet',
    response: {
      schema: outputPaginationSchema('faucet-wusd', faucetSendWusdWqtResponseSchemas).label('FaucetSendWusdWqtResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/user/me/faucet/wqt',
  handler: sentFaucetWqt,
  options: {
    auth: 'jwt-access',
    id: 'v1.faucet.getFaucetWqt',
    tags: ['api', 'faucet'],
    description: 'Get coins for testing from the faucet',
    response: {
      schema: outputPaginationSchema('faucet-wqt', faucetSendWusdWqtResponseSchemas).label('FaucetSendWusdWqtResponse')
    }
  }
}, ]
