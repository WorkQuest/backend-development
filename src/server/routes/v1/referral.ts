import * as Joi from 'joi';
import * as handlers from '../../api/referral';
import {
  limitSchema,
  offsetSchema,
  referralSchema,
  outputOkSchema,
  referralProgramUserReferralsScheme,
  referralProgramReferralsShortScheme,
  blockNumberSchema,
  transactionHashSchema,
  idSchema,
  coinAmountSchema,
  timestampSchema
  referralProgramUserClaimedEventScheme,
  accountAddressSchema,
  outputPaginationSchema,
  accountAddressesSchema,
} from '@workquest/database-models/lib/schemes';

enum eventName {
  PaidReferral = "PaidReferral",
  RewardClaimed = "RewardClaimed",
}

const referralProgramEventNameSchema = Joi.string().valid(...Object.values(eventName)).example(eventName.PaidReferral).label('ReferralProgramEventName');

const referralProgramClaimOrPaidEventSchema = Joi.object({
  blockNumber: blockNumberSchema,
  transactionHash: transactionHashSchema,
  referral: idSchema,
  affiliate: idSchema,
  amount: coinAmountSchema,
  timestamp: timestampSchema,
  event: referralProgramEventNameSchema
})
const getMyReferralProgramClaimedAndPaidEventsSchemas = Joi.array().items(referralProgramClaimOrPaidEventSchema).label('ReferralProgramClaimedAndPaidEvents')

export default [{
  method: 'GET',
  path: '/v1/user/me/referral-program/referrals',
  handler: handlers.getMyReferrals,
  options: {
    auth: 'jwt-access',
    id: 'v1.referralProgram.getMyReferrals',
    tags: ['api', 'referral-program'],
    description: 'Get my referrals',
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetMyReferralsQuery')
    },
    response: {
      schema: outputPaginationSchema('referrals', referralSchema).label('GetMyReferralsResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/user/me/referral-program/referral/signature/created-referrals',
  handler: handlers.getMySignedCreatedReferrals,
  options: {
    auth: 'jwt-access',
    id: 'v1.referralProgram.getMySignedCreatedReferrals',
    tags: ['api', 'referral-program'],
    description: 'Get my signed created referrals',
    response: {
      schema: outputOkSchema(
        Joi.object({
          v: accountAddressSchema,
          r: accountAddressSchema,
          s: accountAddressSchema,
          addresses: accountAddressesSchema,
        }).label('SignedCreatedReferrals')
      ).label('GetMySignedCreatedReferralsResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/user/me/referral-program/claimed-events',
  handler: handlers.getMyReferralProgramClaimedAndPaidEvents,
  options: {
    auth: 'jwt-access',
    id: 'v1.referral.claim',
    tags: ['api', 'referral-program'],
    description: 'Get all events paid or claimed',
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetMyReferralProgramClaimedEvents')
    },
    response: {
      schema: outputOkSchema(getMyReferralProgramClaimedAndPaidEventsSchemas)
    }
  }
}];
