import { LoginApp } from '@workquest/database-models/lib/models/user/types';
import { fn, literal, Op, QueryTypes } from 'sequelize';
import { addJob } from '../utils/scheduler';
import {
  RatingStatus,
  StatusKYC,
  User,
  UserRole,
  UsersPlatformStatistic,
  UserStatus
} from '@workquest/database-models/lib/models';

const platformQuery = `
    SELECT type, COUNT(*)
    FROM (SELECT (
                     CASE
                         WHEN (device ILIKE 'Android%' OR device ILIKE 'iOS%' OR device ILIKE 'Dart%') AND app = '${LoginApp.App}'
                             THEN 'app'
                         WHEN (device ILIKE 'Android%' OR device ILIKE 'iOS%' OR device ILIKE 'Dart%') AND app = '${LoginApp.Wallet}'
                             THEN 'wallet'
                         ELSE 'web' END
                     ) as type
          FROM "Sessions") as q
    GROUP BY type;
`;

const ratingStatusesQuery = `
  SELECT status, COUNT(*) FROM "RatingStatistics" GROUP BY status;
`

async function userRawCountBuilder(query: string) {
  const rawCount = await User.sequelize.query(query, { type: QueryTypes.SELECT });
  const countObject = {};

  rawCount.forEach((count) => {
    const [mainKey, countKey] = Object.keys(count);

    countObject[count[mainKey]] = parseInt(count[countKey]);
  });

  return countObject;
}

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

  return addJob('writeDailyUserStatistics', {}, { 'run_at': runAt });
}

export default async function() {
  await addWriteStatisticsJob();

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
  const platformType = await userRawCountBuilder(platformQuery);
  const ratingStatuses = await userRawCountBuilder(ratingStatusesQuery);

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

  for (const platform in platformType) {
    if (platform === 'app') {
      todayUserStatistics.useApp = platformType[platform];
    } else if (platform === 'wallet') {
      todayUserStatistics.useWallet = platformType[platform];
    } else if (platform === 'web') {
      todayUserStatistics.useWeb = platformType[platform];
    }
  }

  for (const ratingStatus in ratingStatuses) {
    if (parseInt(ratingStatus) === RatingStatus.NoStatus) {
      todayUserStatistics.noStatus = ratingStatuses[ratingStatus];
    } else if (parseInt(ratingStatus) === RatingStatus.Verified) {
      todayUserStatistics.verified = ratingStatuses[ratingStatus];
    } else if (parseInt(ratingStatus) === RatingStatus.Reliable) {
      todayUserStatistics.reliable = ratingStatuses[ratingStatus];
    } else if (parseInt(ratingStatus) === RatingStatus.TopRanked) {
      todayUserStatistics.topRanked = ratingStatuses[ratingStatus];
    }
  }

  todayUserStatistics.registered = await User.unscoped().count();

  todayUserStatistics.use2FA = await User.unscoped().count({
    where: { 'settings.security.TOTP.active': true }
  });

  await todayUserStatistics.save();
}
