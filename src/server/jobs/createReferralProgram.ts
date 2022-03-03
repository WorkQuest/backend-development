import { addJob } from '../utils/scheduler';
import {
  ReferralProgram,
  ReferralProgramAffiliate,
  ReferralStatus, User
} from '@workquest/database-models/lib/models';

export interface CreateReferralProgramPayload {
  userId: string;
  referralId?: string;
}

export async function createReferralProgram(payload: CreateReferralProgramPayload) {
  return addJob('createReferralProgram', payload);
}

export default async function(payload: CreateReferralProgramPayload) {
  const user = await User.findByPk(payload.userId);

  const referralProgram = await ReferralProgram.scope('referral').findOne({
    where: { referralId: payload.referralId },
  });

  if (!user) {
    return;
  }
  if (payload.referralId && !referralProgram) {
    return;
  }
  if (payload.referralId) {
    await ReferralProgramAffiliate.create({
      affiliateUserId: payload.userId,
      referralProgramId: referralProgram.id,
      referralStatus: ReferralStatus.Created,
    });
  }

  await ReferralProgram.create({ referrerUserId: user.id });
}
