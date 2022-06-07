import { reportEntities, ReportEntityType } from '@workquest/database-models/lib/models';
import { EntityReport } from './GetEntityForReportHandler';
import { Errors } from '../../utils/errors';
import { error } from '../../utils';

export class ReportValidator {

  public hasEntity(entityType: ReportEntityType) {
    if (!reportEntities[entityType]) {
      throw error(Errors.NotFound, 'Entity not found', { entityType });
    }
  }

  public isEntityExist(entity: EntityReport) {
    if (!entity) {
      throw error(Errors.NotFound, 'Entity not found', {})
    }
  }
}
