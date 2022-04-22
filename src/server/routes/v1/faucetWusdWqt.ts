import * as Joi from 'joi';
import * as handlers from '../../api/faucetWusdWqt';
import {
  outputPaginationSchema,
  faucetSendWusdResponseSchemas
} from '@workquest/database-models/lib/schemes';

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
      schema: outputPaginationSchema('faucet', faucetSendWusdResponseSchemas).label('FaucetSendWusdResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/user/me/faucet/wqt',
  handler: handlers.sentFaucetWqt,
  options: {
    auth: false,//'jwt-access',
    id: 'v1.faucet.getFaucetWqt',
    tags: ['api', 'faucet'],
    description: 'Get coins for testing from the faucet',
    response: {
      schema: outputPaginationSchema('faucet', faucetSendWusdResponseSchemas).label('FaucetSendWusdResponse')
    }
  }
}, ]
