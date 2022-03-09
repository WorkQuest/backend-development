import { addJob } from '../utils/scheduler';
import {
  User,
  ReferralStatus,
  ReferralProgramReferral,
  ReferralProgramAffiliate
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

  const referralProgram = await ReferralProgramAffiliate.scope('referral').findOne({
    where: { referralCodeId: payload.referralId },
  });

  if (!user) {
    return;
  }
  if (payload.referralId && !referralProgram) {
    return;
  }
  if (payload.referralId) {
    await ReferralProgramReferral.create({
      referralUserId: payload.userId,
      referralProgramId: referralProgram.id,
      referralStatus: ReferralStatus.Created,
    });
  }

  await ReferralProgramAffiliate.create({ affiliateUserId: user.id });
}
