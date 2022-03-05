import Web3 from 'web3';
import { Errors } from '../utils/errors';
import { error, output } from '../utils';
import configReferral from '../config/config.referral';
import {
  User,
  RewardStatus,
  ReferralStatus,
  ReferralProgram,
  ReferralProgramAffiliate,
  ReferralEventRewardClaimed
} from '@workquest/database-models/lib/models';

export async function getReferralUserAffiliates(r) {
  const user: User = r.auth.credentials;

  const { count, rows } = await ReferralProgramAffiliate.scope('shortReferralProgramAffiliates').findAndCountAll({
    include: [{
      model: ReferralProgram,
      where: { referrerUserId: user.id },
      as: 'referralProgram',
      required: false
    }],
    limit: r.query.limit,
    offset: r.query.offset
  });

  if (count === 0) {
    return error(Errors.LiquidityError, 'Referral not found', {});
  }

  return output({
    paidRewards: rows[0].referralProgram.paidReward,
    referralId: rows[0].referralProgram.referralId,
    count,
    affiliates: rows.map((value) => value.user)
  });
}

export async function signReferralUserAffiliates(r) {
  const user: User = r.auth.credentials;

  const affiliatesReferralProgram = await ReferralProgramAffiliate.scope('defaultScope').findAll({
    include: [{
      model: ReferralProgram,
      where: { referrerUserId: user.id },
      as: 'referralProgram',
      required: false
    }],
    where: {
      affiliateUserId: r.payload.affiliates,
      referralStatus: ReferralStatus.Created
    }
  });

  if (!affiliatesReferralProgram.length) {
    return error(Errors.NotFound, 'Affiliates does not exist', {});
  }

  const wallets = affiliatesReferralProgram.map((value) => value.user.wallet.address);

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

export async function getReferralUserClaimedEvents(r) {
  const user: User = r.auth.credentials;

  const { count, rows } = await ReferralProgramAffiliate.scope('defaultScope').findAndCountAll({
    include: [{
      model: ReferralProgram,
      where: { referrerUserId: user.id },
      as: 'referralProgram',
      required: false
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

