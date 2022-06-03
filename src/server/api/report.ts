import {output} from "../utils";
import { User, ReportEntityType } from '@workquest/database-models/lib/models';
import {
  SendReportHandler,
  GetMediaByIdsHandler,
  GetEntityForReportHandler,
  SendReportPreAccessPermission,
  GetMediasPostValidationHandler,
  GetEntityForReportPreValidateHandler,
} from '../handlers';

export async function sendReport(r) {
  const meUser: User = r.auth.credentials;

  const {
    title,
    mediaIds,
    entityId,
    entityType,
    description,
  } = r.payload as {
    title: string,
    description: string,
    mediaIds: string[],
    entityId: string,
    entityType: ReportEntityType,
  };

  const medias = await new GetMediasPostValidationHandler(
    new GetMediaByIdsHandler()
  ).Handle({ mediaIds });

  const entity = await new GetEntityForReportPreValidateHandler(
    new GetEntityForReportHandler()
  ).Handle({ entityId, entityType });

  const report = await new SendReportPreAccessPermission(
    new SendReportHandler(r.server.app.db),
  ).Handle({ author: meUser, title, description, medias, entityType, entity })

  return output(report);
}
