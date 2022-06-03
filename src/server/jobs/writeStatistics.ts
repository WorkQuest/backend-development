import { addJob } from '../utils/scheduler';
import { StatusKYC, User, UserRole, UsersPlatformStatistic, UserStatus } from '@workquest/database-models/lib/models';
import { fn, literal, Op } from 'sequelize';

const yesterdayDate = new Date(Date.now() - 86400000).toDateString();

async function userGroupCountBuilder(...group): Promise<{ [key: string]: number }> {
  const count: any = await User.unscoped().count({ group });
  const countObject = {};

  count.forEach((count) => {
    const [mainKey, countKey] = Object.keys(count);

    countObject[count[mainKey]] = parseInt(count[countKey]);
  });

  return countObject;
}

export async function addWriteStatisticsJob() {
  const runAt = new Date(new Date().setHours(23, 55, 0));

  return addJob('writeStatistics', {}, { 'run_at': runAt });
}

async function writeUserStatistics() {
  const [todayUserStatistics] = await UsersPlatformStatistic.findOrBuild({
    where: { date: new Date() }
  });

  const roles = await userGroupCountBuilder('role');
  const statuses = await userGroupCountBuilder('status');
  const socialNetworks = await userGroupCountBuilder(
    fn(`jsonb_object_keys`, literal(`(settings ->> 'social')::jsonb`))
  );
  const kycPassed = await userGroupCountBuilder('statusKYC');
  const smsPassed = await userGroupCountBuilder(
    fn('CAST', literal('"phone" IS NOT NULL as bool'))
  );

  for (const statusesKey in statuses) {
    if (parseInt(statusesKey) === UserStatus.Confirmed) {
      todayUserStatistics.finished = statuses[statusesKey];
    } else {
      todayUserStatistics.unfinished += statuses[statusesKey];
    }
  }

  for (const role in roles) {
    if (role === UserRole.Worker) {
      todayUserStatistics.workers = roles[role];
    } else if (role === UserRole.Employer) {
      todayUserStatistics.employers = roles[role];
    }
  }

  for (const socialNetwork in socialNetworks) {
    todayUserStatistics[socialNetwork] = socialNetworks[socialNetwork];
  }

  for (const status in kycPassed) {
    if (parseInt(status) === StatusKYC.Confirmed) {
      todayUserStatistics.kycPassed = kycPassed[status];
    } else {
      todayUserStatistics.kycNotPassed = kycPassed[status];
    }
  }

  for (const confirmed in smsPassed) {
    if (confirmed === 'true') {
      todayUserStatistics.smsPassed = smsPassed[confirmed];
    } else {
      todayUserStatistics.smsNotPassed = smsPassed[confirmed];
    }
  }

  todayUserStatistics.registered = await User.unscoped().count({
    where: {
      createdAt: {
        [Op.between]: [
          new Date().setHours(0, 0, 0, 0),
          new Date().setHours(23, 59, 59, 999)
        ]
      }
    },
  });

  todayUserStatistics.use2FA = await User.unscoped().count({
    where: { 'settings.security.TOTP.active': true }
  });
}

export default async function() {
  await addWriteStatisticsJob();

  await Promise.all([
    writeUserStatistics()
  ]);
}
