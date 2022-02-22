import Web3 from 'web3';
import config from '../config/config';
import { Op } from 'sequelize';
import { error, output } from '../utils';
import { AffiliateStatus, Referral, ReferrerAffiliate } from '@workquest/database-models/lib/models';
import { Errors } from '../utils/errors';


// const linkWsProvider = config.referralRewards.webSocketProvider;
//
// const web3 = new Web3(new Web3.providers.WebsocketProvider(linkWsProvider));

export async function referralInfo(r) {
  const referral = await Referral.scope('referral').findByPk(r.auth.credentials.id);

  if (!referral) {
    return error(Errors.LiquidityError, 'Referral not found', {});
  }

  return output();
}

export async function addAffiliates(r) {
  // const referrer = r.auth.credentials.id;

  const affiliates = await ReferrerAffiliate.scope('defaultScope').findAndCountAll({
    where: {
      affiliateId: { [Op.in]: r.payload.affiliates },
      status: AffiliateStatus.New
    }
  });
  if (!affiliates) {
    return error(Errors.NotFound, 'Affiliate dose not exist', {});
  }
  console.log(affiliates);

  // if (participants.status !== StatusReward.Unassigned) {
  //   return error(Errors.Forbidden, `Reward status ${participants.status}, reward does not start again`, {});
  // }
  //
  // const data = web3.utils.soliditySha3(participants.affiliateWallet, participants.userWallet);
  // const signed = await web3.eth.accounts.sign(data, config.bridge.privateKey);
  // if (!signed) {
  //   return error(Errors.LiquidityError, 'Can`t signed params', {});
  // }
  //
  // const addMessageHash = await ReferralProgram.update({ messageHash: signed.messageHash }, {
  //   where: { userId: r.auth.credentials.id, affiliateWallet: participants.affiliateWallet }
  // });
  // if (!addMessageHash) {
  //   return error(Errors.Forbidden, 'Can`t create parameter "messageHash"', {});
  // }
  //
  // const updateReferral = await ReferralProgram.scope('affiliate').findByPk(participants.id);
  //
  // const signData = {
  //   _affiliate: updateReferral.affiliateWallet,
  //   msgSender: updateReferral.userWallet,
  //   sign: [signed.v, signed.r, signed.s]
  // };

  return output();

}
