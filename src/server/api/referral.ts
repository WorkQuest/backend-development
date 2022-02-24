import Web3 from 'web3';
import { Op } from 'sequelize';
import { error, output } from '../utils';
import { AffiliateStatus, Referral, ReferrerAffiliate } from '@workquest/database-models/lib/models';
import { Errors } from '../utils/errors';
import configReferral from '../config/config.referral';


const linkWsProvider = configReferral.wssProviderLink;

const web3 = new Web3(new Web3.providers.WebsocketProvider(linkWsProvider));

export async function myAffiliates(r) {
  const referral = await Referral.scope('referral').findOne({where:{userId: 'a2ec96c7-8946-41f2-8a2a-3b2426ed544d'}});

  if (!referral) {
    return error(Errors.LiquidityError, 'Referral not found', {});
  }
  const myAffiliates = await ReferrerAffiliate.scope('defaultScope').findAndCountAll({
    where: {
      userReferralId: referral.referralId
    }
  })
  console.log(myAffiliates);

  return output(myAffiliates);
}

export async function addAffiliates(r) {

  const referralId = await Referral.scope('referral').findByPk(r.auth.credentials.id)

  const affiliates = await ReferrerAffiliate.scope('defaultScope').findAndCountAll({
    where: {
      userReferralId: referralId.referralId,
      affiliateId: { [Op.in]: r.payload.affiliates },
      status: AffiliateStatus.New
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
