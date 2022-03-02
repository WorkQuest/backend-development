import Web3 from 'web3';
import { Op } from 'sequelize';
import { error, output } from '../utils';
import {
  RewardStatus,
  ReferralStatus,
  ReferralProgram,
  ReferralProgramAffiliate, ReferralEventRewardClaimed
} from '@workquest/database-models/lib/models';
import { Errors } from '../utils/errors';
import configReferral from '../config/config.referral';

export async function myAffiliates(r) {
  const user = r.auth.credentials.id;

  const userReferralProgram = await ReferralProgram.unscoped().findOne({
    where: {
      referrerUserId: user
    }
  });

  if (!userReferralProgram) {
    return error(Errors.LiquidityError, 'Referral not found', {});
  }

  const { count, rows } = await ReferralProgramAffiliate.scope('shortAffiliate').findAndCountAll({
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    where: { referralProgramId: userReferralProgram.id },
    order: [['createdAt', 'DESC']]
  });
  return output({
    referralProgramId: userReferralProgram.id,
    referralId: userReferralProgram.referralId,
    count,
    referralProgramAffiliates: rows
  });
}

export async function addAffiliates(r) {
  const linkWsProvider = configReferral.wssProviderLink;
  const web3 = new Web3(new Web3.providers.WebsocketProvider(linkWsProvider));

  const referralId = await ReferralProgram.unscoped().findOne({
    where: {
      referrerUserId: r.auth.credentials.id
    }
  });

  const affiliatesReferralProgram = await ReferralProgramAffiliate.scope('defaultScope').findAndCountAll({
    where: {
      referralProgramId: referralId.id,
      affiliateId: { [Op.in]: r.payload.affiliates },
      status: ReferralStatus.Created
    }
  });
  if (!affiliatesReferralProgram) {
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
  const referral = await ReferralProgram.scope('referral').findOne({
    where: {
      referrerUserId: r.auth.credentials.id
    }
  });

  const { count, rows } = await ReferralProgramAffiliate.scope('defaultScope').findAndCountAll({

    where: {
      referralProgramId: referral.id,
      rewardStatus: RewardStatus.Claimed
    }
  });

  const events = await ReferralEventRewardClaimed.findAndCountAll({
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset
  });

  return output();
}

