import { getUser } from '../../api/v1/user';
import { outputOkSchema } from '../../schemes';
import * as Joi from '@hapi/joi'
export default [{
  method: 'GET',
  path: '/v1/user',
  handler: getUser,
  options: {
    id: 'v1.user.get',
    tags: ['api', 'v1', 'user'],
    response: {
      schema: outputOkSchema(Joi.object({
        firstName: Joi.string().example('John')
      }))
    }
  }
}]
