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
        attributes: ["referralCodeId"],
      }]
    },
    limit: r.query.limit,
    offset: r.query.offset
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

export async function getMyReferralProgramClaimedEvents(r) {
  const affiliateUser: User = r.auth.credentials;

  const affiliateWallet = await ReferralProgramAffiliate.findOne({
    where: { affiliateUserId: affiliateUser.id },
    include: [{
      model: ReferralProgramEventRewardClaimed
    }]
  });

  const claimedEvents = await ReferralProgramEventRewardClaimed.findAll({
    where: { affiliate: affiliateWallet.affiliateUser.wallet.address },
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'DESC']],
  })

  return output({events: claimedEvents });
}
