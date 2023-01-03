import { Op } from 'sequelize';
import { error } from '../../utils';
import { Errors } from '../../utils/errors';
import {
  User,
  Quest,
  UserRole,
  QuestStatus,
  QuestsResponse,
  UserChangeRoleData,
  QuestsResponseStatus,
} from '@workquest/database-models/lib/models';

export class UserValidator {
  public HasNotNull(user: User, userId: string) {
    if (!user) {
      throw error(Errors.NotFound, 'User is not found', {
        userId,
      });
    }
  }
  public MustBeWorker(user: User) {
    if (user.role !== UserRole.Worker) {
      throw error(Errors.NotFound, 'User is not worker', {});
    }
  }
  public MustBeEmployer(user: User) {
    if (user.role !== UserRole.Employer) {
      throw error(Errors.NotFound, 'User is not employer', {});
    }
  }
  public HasActiveStatusTOTP(user: User) {
    if (!user.settings.security.TOTP.active) {
      throw error(Errors.InvalidActiveStatusTOTP, 'TOTP has not enable', {});
    }
  }
  public async CanChangeRoleByDateRange(user: User) {
    /** 1 Mount - 2592000000, for DEBUG - 1 minute - 60000 */
    const roleChangeTimeLimitInMilliseconds = 2592000000; // Changed by Sarvar on task WOR-34

    const lastRoleChangeData = await UserChangeRoleData.findOne({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
    });

    const userRegistrationDate: Date = user.createdAt;

    const lastRoleChangeDate: Date | null =
      lastRoleChangeData
        ? lastRoleChangeData.createdAt
        : null

    const allowedChangeRoleFromDateInMilliseconds =
      lastRoleChangeData
        ? lastRoleChangeDate.getTime() + roleChangeTimeLimitInMilliseconds
        : userRegistrationDate.getTime() + roleChangeTimeLimitInMilliseconds

    if (Date.now() < allowedChangeRoleFromDateInMilliseconds) {
      throw error(Errors.Forbidden, 'Role change timeout has not passed yet', {
        endDateOfTimeout: new Date(allowedChangeRoleFromDateInMilliseconds),
      });
    }
  }
  public async EmployerHasNotActiveQuests(user: User) {
    const questCount = await Quest.count({
      where: {
        userId: user.id,
        status: {
          [Op.notIn]: [
            QuestStatus.Closed,
            QuestStatus.Completed,
          ]
        }
      }
    });

    if (questCount !== 0) {
      return error(Errors.HasActiveQuests, 'There are active quests', { questCount });
    }
  }
  public async WorkerHasNotActiveQuests(user: User) {
    const questCount = await Quest.count({
      where: {
        assignedWorkerId: user.id,
        status: {
          [Op.notIn]: [
            QuestStatus.Closed,
            QuestStatus.Blocked,
            QuestStatus.Completed,
          ],
        },
      },
    });

    if (questCount !== 0) {
      throw error(Errors.HasActiveQuests, 'There are active quests', { questCount });
    }
  }
  public async WorkerHasNotActiveResponses(user: User) {
    const questsResponseCount = await QuestsResponse.count({
      where: {
        workerId: user.id,
        status: { [Op.notIn]: [QuestsResponseStatus.Closed, QuestsResponseStatus.Rejected] }
      }
    });

    if (questsResponseCount !== 0) {
      throw error(Errors.HasActiveResponses, 'There are active responses', { questsResponseCount });
    }
  }
  public HasCompleteSetValidate(users: User[], userIds: string[]) {
    if (users.length !== userIds.length) {
      const userFindingIds = users.map(user => { return user.id });
      const notFoundUserIds = userIds.filter(userId => !userFindingIds.includes(userId));
      throw error(Errors.NotFound, 'Users not found', { userIds: notFoundUserIds });
    }
  }
}
