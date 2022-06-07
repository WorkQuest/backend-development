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
  DaoPlatformStatistic,
} from '@workquest/database-models/lib/models';

const searchOptions = { where: { date: new Date() } };

async function writeStatistic(statisticModel, incrementField: string) {
  return statisticModel.increment(incrementField, searchOptions);
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
}

export default async function(payload: { incrementField: string }) {
  try {
    let statisticUpdated = false;

    for (const method in methods) {
      const ifExist = methods[method].array.includes(payload.incrementField);

      if (!ifExist) {
        continue;
      }

      const [[, updated]] = await writeStatistic(methods[method].model, payload.incrementField);

      statisticUpdated = updated;
    }

    if (!statisticUpdated) {
      await Promise.all([
        RaiseViewsPlatformStatistic.findOrCreate(searchOptions),
        DisputesPlatformStatistic.findOrCreate(searchOptions),
        ReportsPlatformStatistic.findOrCreate(searchOptions),
        QuestsPlatformStatistic.findOrCreate(searchOptions),
        UsersPlatformStatistic.findOrCreate(searchOptions),
        DaoPlatformStatistic.findOrCreate(searchOptions),
      ]);
    }
  } catch (err) {
    console.log(err);

    throw err;
  }
}