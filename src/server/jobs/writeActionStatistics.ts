import { StatisticAction } from '../controllers/statistic/controller.baseStatistic';
import {
  raiseViewsPlatformStatisticFieldsArray,
  disputesPlatformStatisticFieldsArray,
  reportsPlatformStatisticFieldsArray,
  questsPlatformStatisticFieldsArray,
  usersPlatformStatisticFieldsArray,
  daoPlatformStatisticFieldsArray,
  RaiseViewsPlatformStatistic,
  DisputesPlatformStatistic,
  ReportsPlatformStatistic,
  QuestsPlatformStatistic,
  UsersPlatformStatistic,
  DaoPlatformStatistic
} from '@workquest/database-models/lib/models';

const searchOptions = { where: { date: new Date() } };

async function writeStatistic(statisticModel, incrementField: string, by: string | number = 1, type: StatisticAction) {
  return statisticModel[type].call(statisticModel, incrementField, { ...searchOptions, by });
}

const methods = {
  raiseView: {
    model: RaiseViewsPlatformStatistic,
    array: raiseViewsPlatformStatisticFieldsArray
  },
  dispute: {
    model: DisputesPlatformStatistic,
    array: disputesPlatformStatisticFieldsArray
  },
  report: {
    model: ReportsPlatformStatistic,
    array: reportsPlatformStatisticFieldsArray
  },
  quest: {
    model: QuestsPlatformStatistic,
    array: questsPlatformStatisticFieldsArray
  },
  user: {
    model: UsersPlatformStatistic,
    array: usersPlatformStatisticFieldsArray
  },
  dao: {
    model: DaoPlatformStatistic,
    array: daoPlatformStatisticFieldsArray
  }
};

async function createStatisticRows() {
  for (const method in methods) {
    const statistic = await methods[method].model.findOne({
      attributes: { exclude: ['date', 'createdAt', 'updatedAt'] },
      order: [['date', 'DESC']]
    });

    await methods[method].model.findOrCreate({
      ...searchOptions,
      defaults: statistic ? statistic.toJSON() : statistic
    });
  }
}

export default async function(payload: { incrementField: string, statistic: string, by?: number | string, type?: StatisticAction }) {
  try {
    const ifExist = methods[payload.statistic].array.includes(payload.incrementField);

    if (!ifExist) {
      return;
    }

    payload.type ??= 'increment';

    const [[, updated]] = await writeStatistic(
      methods[payload.statistic].model,
      payload.incrementField,
      payload.by,
      payload.type
    );

    if (!updated) {
      await createStatisticRows();
      await writeStatistic(
        methods[payload.statistic].model,
        payload.incrementField,
        payload.by,
        payload.type
      );
    }
  } catch (err) {
    console.log(err);

    throw err;
  }
}
