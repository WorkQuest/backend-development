import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import configReferral from '../config/config.referral';
import {
  referralProgramClaimAndPaidEventsQuery,
  referralProgramClaimAndPaidEventsCountQuery,
} from '../queries';
import {
  User,
  ReferralStatus,
  ReferralProgramReferral,
  ReferralProgramAffiliate, Wallet
} from '@workquest/database-models/lib/models';

export async function getMyReferrals(r) {
  const affiliateUser: User = r.auth.credentials;

  const where = {
    ...(r.query.referralStatus && { referralStatus: r.query.referralStatus })
  };

  const { count, rows } = await User.scope('short').findAndCountAll({
    include: [{
      model: ReferralProgramReferral.unscoped(),
      as: 'referralUser',
      attributes: ['id', 'referralStatus'],
      required: true,
      where,
      include: [{
        model: ReferralProgramAffiliate.unscoped(),
        as: 'referralProgramAffiliate',
        where: { affiliateUserId: affiliateUser.id },
        attributes: ["referralCodeId"],
        required: true,
      }]
    }, {
      model: Wallet,
      as: 'wallet',
      attributes: [],
      required: true,
    }],
    limit: r.query.limit,
    offset: r.query.offset,
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
      required: true,
    },
    where: { referralStatus: ReferralStatus.Created },
  });

  const affiliateAddress = await ReferralProgramAffiliate.findOne({
    where: { affiliateUserId: affiliateUser.id }
  })

  if (!affiliateAddress.affiliateUser) {
    return error(Errors.Forbidden, 'User don`t have wallet', {});
  }

  const referralAddresses: any = referrals
    .filter(referral => referral.referralUser.wallet)
    .map((referral) => referral.referralUser.wallet.address);

  if (referralAddresses.length === 0) {
    return output(null);
  }

  const data = r.server.app.web3.utils.soliditySha3({ t:'address', v: affiliateAddress.affiliateUser.wallet.address }, { t: 'address', v: referralAddresses });
  const signed = await r.server.app.web3.eth.accounts.sign(data, configReferral.privateKey);

  return output({
    v: signed.v,
    r: signed.r,
    s: signed.s,
    addresses: referralAddresses
  });
}

export async function getMyReferralProgramClaimedAndPaidEvents(r) {
  const affiliateUser: User = r.auth.credentials;

  const walletAffiliate = await ReferralProgramAffiliate.findOne({
    where: { affiliateUserId: affiliateUser.id },
  });

  const [countResults] = await r.server.app.db.query(referralProgramClaimAndPaidEventsCountQuery, {
    replacements: { affiliate: walletAffiliate.affiliateUser.wallet.address },
  });
  const [eventsResult] = await r.server.app.db.query(referralProgramClaimAndPaidEventsQuery, {
    replacements: {
      limit: r.query.limit,
      offset: r.query.offset,
      affiliate: walletAffiliate.affiliateUser.wallet.address,
    }
  })

  return output ({ count: countResults[0].count, events: eventsResult });
}
