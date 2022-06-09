import { BaseStatisticController } from './controller.baseStatistic';
import {
  DisputesPlatformStatisticFields,
  QuestsPlatformStatisticFields,
  QuestStatus
} from '@workquest/database-models/lib/models';

export class QuestStatisticController extends BaseStatisticController {
  static async createQuestAction(price) {
    await this.writeActions({
      incrementFields: [
        QuestsPlatformStatisticFields.Total,
        QuestsPlatformStatisticFields.Pending
      ],
      statistic: 'quest'
    });
    await this.writeAction({
      incrementFields: QuestsPlatformStatisticFields.Sum,
      statistic: 'quest',
      by: price
    });
  }

  static async createDisputeAction() {
    await this.writeActions({
      incrementFields: [
        DisputesPlatformStatisticFields.Pending,
        DisputesPlatformStatisticFields.Total
      ],
      statistic: 'dispute'
    });
  }
}
