import Web3 from 'web3';
import { Op } from 'sequelize';
import { error, output } from '../utils';
import {
  AffiliateStatus,
  ReferralProgram,
  ReferrerAffiliateUser,
  ReferralEventRewardClaimed
} from '@workquest/database-models/lib/models';
import { Errors } from '../utils/errors';
import configReferral from '../config/config.referral';


const linkWsProvider = configReferral.wssProviderLink;

const web3 = new Web3(new Web3.providers.WebsocketProvider(linkWsProvider));

export async function myAffiliates(r) {
  const referral = await ReferralProgram.scope('referral').findOne({ where: { userId: r.params.userId } });

  if (!referral) {
    return error(Errors.LiquidityError, 'Referral not found', {});
  }
  const affiliatesInfo = await ReferrerAffiliateUser.scope('shortAffiliate').findAndCountAll({
    where: {
      userReferralId: referral.referralId
    }
  });
  return output(affiliatesInfo);
}

export async function addAffiliates(r) {

  const referralId = await ReferralProgram.scope('referral').findByPk(r.auth.credentials.id);

  const affiliates = await ReferrerAffiliateUser.scope('defaultScope').findAndCountAll({
    where: {
      userReferralId: referralId.referralId,
      affiliateId: { [Op.in]: r.payload.affiliates },
      status: AffiliateStatus.Created
    }
  });
  if (!affiliates) {
    return error(Errors.NotFound, 'Affiliates does not exist', {});
  }

  const walletsAffiliate = [];
  for (let i = 0; i < affiliates.count; i++) {
    if (affiliates.rows[i].user.wallet !== null) {
      walletsAffiliate.push(affiliates.rows[i].user.wallet.address);
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

  const referral = await ReferralProgram.scope('referral').findOne({ where: { userId: r.params.userId } });

  const events = await ReferralEventRewardClaimed.findAndCountAll({
    where: {
//TODO add takes events (ClaimRewards)
    }
  });
  const referralId = await ReferralProgram.scope('referral').findByPk(r.auth.credentials.id);

}

