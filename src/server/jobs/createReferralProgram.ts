import {
  ReferralProgram,
  ReferralProgramAffiliate,
  ReferralStatus
} from '@workquest/database-models/lib/models';
import { addJob } from '../utils/scheduler';

export interface CreateReferralProgramPayload {
  userId: string;
  referralId: string;
}

export async function createReferralProgram(payload: CreateReferralProgramPayload) {
  return addJob('CreateReferralProgram', payload);
}

export default async function(CreateReferralProgramPayload) {

  const addAffiliate = await ReferralProgram.scope('referral').findOne({
    where: { referralId: CreateReferralProgramPayload.referralId }
  });

  await ReferralProgramAffiliate.findOne({
    where: { affiliateUserId: CreateReferralProgramPayload.userId }
  });

  await ReferralProgramAffiliate.create({
    affiliateUserId: CreateReferralProgramPayload.userId,
    referralProgramId: addAffiliate.id,
    referralStatus: ReferralStatus.Created
  });

}
