import { addJob } from '../utils/scheduler';
import {
  User,
  ReferralStatus,
  ReferralProgramReferral,
  ReferralProgramAffiliate,
} from '@workquest/database-models/lib/models';

export interface CreateReferralProgramPayload {
  userId: string;
  referralId?: string;
}

export async function createReferralProgramJob(payload: CreateReferralProgramPayload) {
  return addJob('createReferralProgram', payload);
}

export default async function(payload: CreateReferralProgramPayload) {
  const user = await User.findByPk(payload.userId);

  const referralProgramAffiliate = await ReferralProgramAffiliate.findOne({
    where: { referralCodeId: payload.referralId },
  });

  if (!user) {
    return;
  }
  if (payload.referralId && !referralProgramAffiliate) {
    return;
  }
  if (payload.referralId) {
    await ReferralProgramReferral.create({
      referralUserId: payload.userId,
      affiliateId: referralProgramAffiliate.id,
      referralStatus: ReferralStatus.Created,
    });
  }

  await ReferralProgramAffiliate.create({ affiliateUserId: user.id });
}
