import Web3 from 'web3';
import { Op } from 'sequelize';
import { error, output } from '../utils';
import {
  ReferralStatus,
  ReferralProgram,
  ReferralProgramAffiliate
} from '@workquest/database-models/lib/models';
import { Errors } from '../utils/errors';
import configReferral from '../config/config.referral';

export async function myAffiliates(r) {
  const user = r.auth.credentials.id

  const userReferralProgram = await ReferralProgram.unscoped().findOne({
    where: {
      referrerUserId: user
    }
  });

  if (!userReferralProgram) {
    return error(Errors.LiquidityError, 'Referral not found', {});
  }

  const { count, rows } = await ReferralProgramAffiliate.scope('shortAffiliate').findAndCountAll({
    where: {
      referralProgramId: userReferralProgram.id
    }
  });
  return output({
    referralProgramId: userReferralProgram.id,
    referralId: userReferralProgram.referralId,
    count,
    rows
  });
}

export async function addAffiliates(r) {
  const linkWsProvider = configReferral.wssProviderLink;
  const web3 = new Web3(new Web3.providers.WebsocketProvider(linkWsProvider));

  const referralId = await ReferralProgram.scope('referral').findByPk(r.auth.credentials.id);

  const affiliates = await ReferralProgramAffiliate.scope('defaultScope').findAndCountAll({
    where: {
      userReferralId: referralId.referralId,
      affiliateId: { [Op.in]: r.payload.affiliates },
      status: ReferralStatus.Created
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

// export async function referralClaimedEvents(r) {
//   const referral = await ReferralProgram.scope('referral').findOne({ where: { userId: r.auth.credentials.id } });
//
//   const { count, rows } = await ReferralProgramAffiliate.scope('defaultScope').findAndCountAll({
//     where: { referralId: referral.referralId }
//   });
//   console.log(count, rows);
//
//   //TODO Добавление списка всех транзакций и вывод начисленных наград
//
//   // const events = await ReferralEventRewardClaimed.findAndCountAll({
//   //   where: {}
//   // });
//   // const referralId = await ReferralProgram.scope('referral').findByPk(r.auth.credentials.id);
//
//   // const { count, rows } = await ProposalVoteCastEvent.findAndCountAll({
//   //   limit: r.query.limit,
//   //   offset: r.query.offset,
//   //   order: [['createdAt', r.query.createdAt]],
//   //   where,
//   // });
// }

