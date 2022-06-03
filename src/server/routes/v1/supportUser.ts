import * as Joi from 'joi';
import * as handlers from '../../api/supportUser';
import {
  limitSchema,
  offsetSchema,
  outputOkSchema,
  userEmailSchema,
  supportTicketSchema,
  outputPaginationSchema,
  titleSupportTicketSchema,
  statusSupportTicketSchema,
  descriptionSupportTicketSchema,
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'POST',
  path: '/v1/user-support-ticket/create',
  handler: handlers.createSupport,
  options: {
    auth: 'jwt-access',
    id: 'v1.user-support.create',
    tags: ['api', 'user-support-ticket'],
    description: 'Create support ticket',
    validate: {
      payload: Joi.object({
        email: userEmailSchema.required(),
        title: titleSupportTicketSchema.required(),
        description: descriptionSupportTicketSchema.required()
      }).label('UserSupportTicketCreatePayload')
    },
    response: {
      schema: outputOkSchema(supportTicketSchema).label('UserSupportTicketCreateResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/user/me/user-support-ticket/tickets',
  handler: handlers.getSupportTickets,
  options: {
    auth: 'jwt-access',
    id: 'v1.user-support-ticket.getTickets',
    tags: ['api', 'user-support-ticket'],
    description: 'Get all support tickets',
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
        status: statusSupportTicketSchema,
      }).label('GetUserSupportTicketQuery')
    },
    response: {
      schema: outputPaginationSchema('tickets', supportTicketSchema).label('GetUserSupportTicketResponse')
    }
  }
}];
