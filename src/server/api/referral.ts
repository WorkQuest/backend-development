import Web3 from 'web3';
import { output } from '../utils';
import configReferral from '../config/config.referral';
import {
  User,
  ReferralStatus,
  ReferralProgramReferral,
  ReferralProgramAffiliate,
  ReferralEventRewardClaimed,
} from '@workquest/database-models/lib/models';

export async function getMyReferrals(r) {
  const affiliateUser: User = r.auth.credentials;

  const { count, rows } = await ReferralProgramReferral.scope('shortReferralProgramAffiliates').findAndCountAll({
    include: {
      model: ReferralProgramAffiliate,
      as: 'affiliate',
      where: { referrerUserId: affiliateUser.id },
      required: true,
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
      attributes: [],
      model: ReferralProgramAffiliate,
      where: { referrerUserId: affiliateUser.id },
      as: 'affiliate',
      required: true,
    },
    attributes: ['user'],
    where: { referralStatus: ReferralStatus.Created },
  });

  const referralAddresses = referrals.map((value) => value.user.wallet.address);

  const web3 = new Web3();
  const data = web3.utils.soliditySha3(...referralAddresses);
  const signed = await web3.eth.accounts.sign(data, configReferral.privateKey);

  return output({
    v: signed.v,
    r: signed.r,
    s: signed.s,
    addresses: referralAddresses,
  });
}

export async function getMyReferralProgramClaimedEvents(r) {
  const affiliateUser: User = r.auth.credentials;

  // TODO: include wallet
  const claimedEvents = await ReferralEventRewardClaimed.findAll({
    where: { affiliate: /**  ???  */ },
  });

  return output({ count, events: claimedEvents });
}
