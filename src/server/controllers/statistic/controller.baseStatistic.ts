import { addJob } from '../../utils/scheduler';

export type Statistics =
  | 'raiseView'
  | 'dispute'
  | 'report'
  | 'quest'
  | 'user'
  | 'dao'

export type StatisticAction = 'increment' | 'decrement'

type WriteActionPayload<Increment> = {
  incrementFields: Increment;
  statistic: Statistics;
  by?: number | string;
  type?: StatisticAction;
}

export class BaseStatisticController {
  static async writeAction(payload: WriteActionPayload<string>) {
    return addJob('writeActionStatistics', {
      incrementField: payload.incrementFields,
      statistic: payload.statistic,
      by: payload.by || 1,
      type: payload.type || 'increment'
    });
  }

  static async writeActions(payload: WriteActionPayload<string[]>) {
    return Promise.all(payload.incrementFields.map((field) => {
      return addJob('writeActionStatistics', {
        incrementField: field,
        statistic: payload.statistic,
        by: payload.by || 1,
        type: payload.type || 'increment'
      });
    }));
  }
}
