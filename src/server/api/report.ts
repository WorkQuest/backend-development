import { output } from '../utils';
import { ReportEntityType, User } from '@workquest/database-models/lib/models';
import { ReportNotificationActions } from '../controllers/controller.broker';
import { ReportStatisticController } from '../controllers/statistic/controller.reportStatistic';
import {
  GetEntityForReportHandler,
  GetEntityForReportPostValidateHandler,
  GetEntityForReportPreValidateHandler,
  GetMediaByIdsHandler,
  GetMediasPostValidationHandler,
  SendReportHandler,
  SendReportPreAccessPermission
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
    new GetEntityForReportPostValidateHandler(
      new GetEntityForReportHandler()
    )
  ).Handle({ entityId, entityType });

  const report = await new SendReportPreAccessPermission(
    new SendReportHandler(r.server.app.db),
  ).Handle({ author: meUser, title, description, medias, entityType, entity });

  await ReportStatisticController.createReportAction(report.entityType);

  r.server.app.broker.sendReportNotification({
    recipients: [r.auth.credentials.id],
    action: ReportNotificationActions.ReportSubmitted,
    data: { id: report.id }
  });

  return output();
}
