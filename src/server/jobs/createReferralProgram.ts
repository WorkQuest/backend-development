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
  if (!user) {
    return;
  }
  await ReferralProgramAffiliate.create({ affiliateUserId: user.id });
  if (payload.referralId) {
    const referralProgramAffiliate = await ReferralProgramAffiliate.findOne({
      where: { referralCodeId: payload.referralId },
    });
    if (!referralProgramAffiliate) {
      return;
    }
    await ReferralProgramReferral.create({
      referralUserId: payload.userId,
      affiliateId: referralProgramAffiliate.id,
      referralStatus: ReferralStatus.Created,
    });
  }
}
