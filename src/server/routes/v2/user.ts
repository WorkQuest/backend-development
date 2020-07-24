import { getUser } from '../../api/v2/user';
import { outputOkSchema } from '../../schemes';

import * as Joi from '@hapi/joi'


export default [{
  method: 'GET',
  path: '/v2/user',
  handler: getUser,
  options: {
    id: 'v2.user.get',
    tags: ['api', 'v2', 'user'],
    response: {
      schema: outputOkSchema(Joi.object({
        firstName: Joi.string().example('John'),
        lastName: Joi.string().example('Smith')
      }))
    }
  }
}]
