import * as Joi from 'joi';
import * as handlers from '../../api/report';
import {
  reportDescriptionSchema,
  reportEntityTypeSchema,
  reportTitleSchema
} from '@workquest/database-models/lib/schemes/report';
import { emptyOkSchema, idSchema, idsSchema } from '@workquest/database-models/lib/schemes';

export default [{
  method: 'POST',
  path: '/v1/report/send',
  handler: handlers.sendReport,
  options: {
    auth: 'jwt-access',
    id: 'v1.report.sendReport',
    tags: ['api', 'reports'],
    description: 'Send reports to entity',
    validate: {
      payload: Joi.object({
        entityType: reportEntityTypeSchema.required(),
        entityId: idSchema.required(),
        title: reportTitleSchema.required(),
        description: reportDescriptionSchema.required(),
        mediaIds: idsSchema.required().unique(),
      }).label('SendReportPayload'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];
