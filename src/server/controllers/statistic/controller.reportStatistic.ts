import { BaseStatisticController } from './controller.baseStatistic';
import { ReportEntityType, ReportsPlatformStatisticFields } from '@workquest/database-models/lib/models';

export class ReportStatisticController extends BaseStatisticController {
  static async createReportAction(entity: ReportEntityType) {
    if (entity === ReportEntityType.DiscussionComment) {
      return;
    }

    await this.writeAction({
      incrementFields: ReportsPlatformStatisticFields[entity + 's'],
      statistic: 'report'
    });
  }
}
