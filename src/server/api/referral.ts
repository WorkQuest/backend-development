import Web3 from 'web3';
import { output } from '../utils';
import configReferral from '../config/config.referral';
import {
  User,
  ReferralStatus,
  ReferralProgramReferral,
  ReferralProgramAffiliate,
  ReferralProgramEventRewardClaimed
} from '@workquest/database-models/lib/models';
import { literal } from 'sequelize';
import path from 'path';
import fs from 'fs';

const referralProgramClaimAndPaidEventsPath = path.join(__dirname, '..', '..', '..', 'raw-queries', 'referralProgramClaimAndPaidEvents.sql');

export const referralProgramClaimAndPaidEventsQuery = fs.readFileSync(referralProgramClaimAndPaidEventsPath).toString();

export async function getMyReferrals(r) {
  const affiliateUser: User = r.auth.credentials;

  const { count, rows } = await User.scope('short').findAndCountAll({
    include: {
      model: ReferralProgramReferral.unscoped(),
      as: 'referralUser',
      required: true,
      attributes: ['id'],
      include: [{
        model: ReferralProgramAffiliate.unscoped(),
        as: 'referralProgramAffiliate',
        where: { affiliateUserId: affiliateUser.id },
        required: true,
        attributes: ['referralCodeId']
      }]
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, referrals: rows });
}

export async function getMySignedCreatedReferrals(r) {
  const affiliateUser: User = r.auth.credentials;

  const referrals = await ReferralProgramReferral.findAll({
    include: {
      model: ReferralProgramAffiliate,
      where: { affiliateUserId: affiliateUser.id },
      as: 'referralProgramAffiliate',
      required: true
    },
    where: { referralStatus: ReferralStatus.Created }
  });

  const referralAddresses = referrals.map((value) => value.referralProgramAffiliate.affiliateUser.wallet.address);

  const web3 = new Web3();
  const data = web3.utils.soliditySha3(...referralAddresses);
  const signed = await web3.eth.accounts.sign(data, configReferral.privateKey);

  return output({
    v: signed.v,
    r: signed.r,
    s: signed.s,
    addresses: referralAddresses
  });
}

export async function getMyReferralProgramClaimedAndPaidEvents(r) {
  const affiliateUser: User = r.auth.credentials;

  const walletAffiliate = await ReferralProgramAffiliate.findOne({
    where: { affiliateUserId: affiliateUser.id }
  })

  const [result] = await r.server.app.db.query(referralProgramClaimAndPaidEventsQuery, {
    replacements: {
      limit: r.query.limit,
      offset: r.query.offset,
      affiliate: walletAffiliate.affiliateUser.wallet.address
    }
  })

  return output (result);
}
