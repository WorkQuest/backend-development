import * as Joi from 'joi';
import * as handlers from '../../api/supportUser';
import {
  outputOkSchema,
  userEmailSchema,
  titleSupportSchema,
  descriptionSupportSchema,
  supportPostResponseSchema
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'POST',
  path: '/v1/user-support/create',
  handler: handlers.createSupport,
  options: {
    auth: 'jwt-access',
    id: 'v1.user-support.create',
    tags: ['api', 'user-support'],
    description: 'Create support ticket',
    validate: {
      payload: Joi.object({
        email: userEmailSchema.required(),
        title: titleSupportSchema.required(),
        description: descriptionSupportSchema.required()
      }).label('UserSupportCreatePayload')
    },
    response: {
      schema: outputOkSchema(supportPostResponseSchema).label('UserSupportCreateResponse'),
    },
  },
}];
