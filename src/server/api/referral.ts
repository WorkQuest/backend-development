import Web3 from 'web3';
import { Errors } from '../utils/errors';
import { error, output } from '../utils';
import configReferral from '../config/config.referral';
import {
  User,
  RewardStatus,
  ReferralStatus,
  ReferralProgramReferral,
  ReferralProgramAffiliate,
  ReferralEventRewardClaimed
} from '@workquest/database-models/lib/models';

export async function getAffiliateUserReferrals(r) {
  const user: User = r.auth.credentials;

  const { count, rows } = await ReferralProgramReferral.scope('shortReferralProgramAffiliates').findAndCountAll({
    include: [{
      model: ReferralProgramAffiliate,
      where: { affiliateUserId: user.id },
      as: 'referralProgram',
      required: true
    }],
    limit: r.query.limit,
    offset: r.query.offset
  });

  if (count === 0) {
    return error(Errors.LiquidityError, 'Referral not found', {});
  }

  return output({
    paidRewards: rows[0].referralProgram.paidReward,
    referralId: rows[0].referralProgram.referralCodeId,
    count,
    affiliates: rows.map((value) => value.user)
  });
}

export async function signAffiliateUserReferrals(r) {
  const user: User = r.auth.credentials;

  const referralsInReferralProgram = await ReferralProgramReferral.scope('defaultScope').findAll({
    include: [{
      model: ReferralProgramAffiliate,
      where: { affiliateUserId: user.id },
      as: 'referralProgram',
      required: true
    }],
    where: {
      referralStatus: ReferralStatus.Created
    }
  });

  if (!referralsInReferralProgram.length) {
    return error(Errors.NotFound, 'Affiliates does not exist', {});
  }

  const wallets = referralsInReferralProgram.map((value) => value.user.wallet.address);

  const web3 = new Web3();
  const data = web3.utils.soliditySha3(...wallets);
  const signed = await web3.eth.accounts.sign(data, configReferral.privateKey);

  return output({
    Parameters: {
      v: signed.v,
      r: signed.r,
      s: signed.s,
      referral: wallets
    }
  });
}

export async function getAffiliateUserClaimedEvents(r) {
  const user: User = r.auth.credentials;

  const { count, rows } = await ReferralProgramReferral.scope('defaultScope').findAndCountAll({
    include: [{
      model: ReferralProgramAffiliate,
      where: { affiliateUserId: user.id },
      as: 'referralProgram',
      required: true
    }],
    where: {
      rewardStatus: RewardStatus.Claimed
    },
    limit: r.query.limit,
    offset: r.query.offset
  });

  if (!rows.length) {
    return error(Errors.NotFound, 'Affiliate users not found', {});
  }

  const result = await Promise.all(rows.map(async (value) => {
    const event = await ReferralEventRewardClaimed.findOne({
      where: { affiliate: value.user.wallet.address }
    });
    return {
      firstName: value.user.firstName,
      lastName: value.user.lastName,
      userId: value.user.id,
      txHash: event.transactionHash,
      createdAt: event.timestamp,
      amount: event.amount,
      status: value.rewardStatus
    };
  }));

  return output({ count, rows: result });
}

