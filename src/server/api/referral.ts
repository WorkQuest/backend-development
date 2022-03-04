import Web3 from 'web3';
import { Op } from 'sequelize';
import { error, output } from '../utils';
import {
  RewardStatus,
  ReferralStatus,
  ReferralProgram,
  ReferralProgramAffiliate,
  ReferralEventRewardClaimed
} from '@workquest/database-models/lib/models';
import { Errors } from '../utils/errors';
import configReferral from '../config/config.referral';

export async function affiliatesInfos(r) {
  const user = r.auth.credentials.id;

  const referral = await ReferralProgram.unscoped().findOne({
    where: { referrerUserId: user }
  });

  const { count, rows } = await ReferralProgramAffiliate.scope('shortReferralProgramAffiliates').findAndCountAll({
    where: { referralProgramId: referral.id },
    limit: r.query.limit,
    offset: r.query.offset
  });

  if (count === 0) {
    return error(Errors.LiquidityError, 'Referral not found', {});
  }

  return output({
    paidRewards: referral.paidReward,
    referralId: referral.referralId,
    count,
    affiliates: rows
  });
}

export async function addAffiliates(r) {
  const user = r.auth.credentials.id
  const referralId = await ReferralProgram.unscoped().findOne({
    where: {
      referrerUserId: user
    }
  });

  const affiliatesReferralProgram = await ReferralProgramAffiliate.scope('defaultScope').findAndCountAll({
    where: {
      referralProgramId: referralId.id,
      affiliateUserId: { [Op.in]: r.payload.affiliates },
      referralStatus: ReferralStatus.Created
    }
  });

  if (affiliatesReferralProgram.count === 0 ) {
    return error(Errors.NotFound, 'Affiliates does not exist', {});
  }

  const walletsAffiliate = [];
  for (let i = 0; i < affiliatesReferralProgram.count; i++) {
    if (affiliatesReferralProgram.rows[i].user.wallet !== null) {
      walletsAffiliate.push(affiliatesReferralProgram.rows[i].user.wallet.address);
    }
  }

  if (walletsAffiliate.length === 0) {
    return error(Errors.NotFound, 'Affiliates does not have wallets', {});
  }

  const web3 = new Web3();
  const data = web3.utils.soliditySha3(...walletsAffiliate);
  const signed = await web3.eth.accounts.sign(data, configReferral.privateKey);

  return output({
    Parameters: {
      v: signed.v,
      r: signed.r,
      s: signed.s,
      referral: walletsAffiliate
    }
  });
}

export async function referralRewardEvents(r) {
  const user = r.auth.credentials.id;

  const referral = await ReferralProgram.unscoped().findOne({
    where: {
      referrerUserId: user
    }
  });

  const { count, rows } = await ReferralProgramAffiliate.scope('defaultScope').findAndCountAll({
    where: {
      referralProgramId: referral.id,
      rewardStatus: RewardStatus.Claimed
    },
    limit: r.query.limit,
    offset: r.query.offset
  });

  if (count === 0) {
    return error(Errors.NotFound, 'Affiliate users not found', {});
  }

  const result = [];
  for (const row of rows) {
    const event = await ReferralEventRewardClaimed.findOne({
      where: { affiliate: row.user.wallet.address }
    });
    result.push({
      name: row.user.firstName + ' ' + row.user.lastName,
      userId: row.user.id,
      txHash: event.transactionHash,
      createdAt: event.timestamp,
      amount: event.amount,
      status: row.rewardStatus
    });
  }

  return output({count, rows: result});
}

