import {
  ReferralProgram,
  ReferralProgramAffiliate,
  ReferralStatus
} from '@workquest/database-models/lib/models';
import { addJob } from '../utils/scheduler';
import { error } from '../utils';
import { Errors } from '../utils/errors';

export interface CreateReferralProgramPayload {
  userId: string;
  referralId: string;
}

export async function createReferralProgram(payload: CreateReferralProgramPayload) {
  return addJob('deleteUserFilters', payload);
}

export default async function(CreateReferralProgramPayload) {

  const addAffiliate = await ReferralProgram.scope('referral').findOne({
    where: { referralId: CreateReferralProgramPayload.referralId }
  });

  const isCreated = await ReferralProgramAffiliate.findOne({
    where: { affiliateUserId: CreateReferralProgramPayload.userId }
  });

  await ReferralProgramAffiliate.create({
    affiliateUserId: CreateReferralProgramPayload.userId,
    referralProgramId: addAffiliate.id,
    referralStatus: ReferralStatus.Created
  });

}
