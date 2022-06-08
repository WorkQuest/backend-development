import { addJob } from '../utils/scheduler';
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

const searchOptionsYesterday = { where: { date: new Date(Date.now() - 86400000) } };
const searchOptions = { where: { date: new Date() } };

export async function writeActionStatistics(incrementField, by = 1) {
  return addJob('writeActionStatistics', { incrementField, by });
}

async function writeIncrementStatistic(statisticModel, incrementField: string, by: string | number = 1) {
  return statisticModel.increment(incrementField, { ...searchOptions, by });
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

export default async function(payload: { incrementField: string, by?: number }) {
  try {
    for (const method in methods) {
      const ifExist = methods[method].array.includes(payload.incrementField);

      if (!ifExist) {
        continue;
      }

      const [[, updated]] = await writeIncrementStatistic(methods[method].model, payload.incrementField, payload.by);

      if (!updated) {
        const [
          raiseViewStatistic,
          disputeStatistic,
          reportStatistic,
          questStatistic,
          userStatistic,
          daoStatistic,
        ] = await Promise.all([
          RaiseViewsPlatformStatistic.findOne({
            ...searchOptionsYesterday,
            attributes: { exclude: ['date'] }
          }),
          DisputesPlatformStatistic.findOne({
            ...searchOptionsYesterday,
            attributes: { exclude: ['date'] }
          }),
          ReportsPlatformStatistic.findOne({
            ...searchOptionsYesterday,
            attributes: { exclude: ['date'] }
          }),
          QuestsPlatformStatistic.findOne({
            ...searchOptionsYesterday,
            attributes: { exclude: ['date'] }
          }),
          UsersPlatformStatistic.findOne({
            ...searchOptionsYesterday,
            attributes: { exclude: ['date'] }
          }),
          DaoPlatformStatistic.findOne({
            ...searchOptionsYesterday,
            attributes: { exclude: ['date'] }
          }),
        ]);

        await Promise.all([
          RaiseViewsPlatformStatistic.findOrCreate({
            ...searchOptions,
            defaults: raiseViewStatistic
          }),
          DisputesPlatformStatistic.findOrCreate({
            ...searchOptions,
            defaults: disputeStatistic
          }),
          ReportsPlatformStatistic.findOrCreate({
            ...searchOptions,
            defaults: reportStatistic
          }),
          QuestsPlatformStatistic.findOrCreate({
            ...searchOptions,
            defaults: questStatistic
          }),
          UsersPlatformStatistic.findOrCreate({
            ...searchOptions,
            defaults: userStatistic
          }),
          DaoPlatformStatistic.findOrCreate({
            ...searchOptions,
            defaults: daoStatistic
          }),
        ]);

        await writeIncrementStatistic(methods[method].model, payload.incrementField, payload.by);
      }
    }
  } catch (err) {
    console.log(err);

    throw err;
  }
}
