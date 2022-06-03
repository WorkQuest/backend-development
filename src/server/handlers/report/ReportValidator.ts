import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import { reportEntities, ReportEntityType } from '@workquest/database-models/lib/models';

export class ReportValidator {

  public hasEntity(entityType: ReportEntityType) {
    if (!reportEntities[entityType]) {
      return error(Errors.NotFound, 'Entity not found', { entityType });
    }
  }
}
