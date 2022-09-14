import { ControllerBroker, QuestNotificationActions } from '../controllers/controller.broker';
import {
  Quest,
  QuestSpecializationFilter,
  QuestStatus,
  UserSpecializationFilter
} from '@workquest/database-models/lib/models';
import { addJob } from '../utils/scheduler';
import { Op } from 'sequelize';

const brokerController = new ControllerBroker();

export interface SendNotificationAboutNewQuestPayload {
  questId: string;
  excludeWorkerIds?: string[];
}

export function sendNotificationAboutNewQuestJob(payload: SendNotificationAboutNewQuestPayload) {
  return addJob('sendNotificationAboutNewQuest', payload)
}

export default async function(payload: SendNotificationAboutNewQuestPayload) {
  const quest = await Quest.findByPk(payload.questId);

  if (!quest) {
    return;
  }

  if (quest.status !== QuestStatus.Recruitment) {
    return;
  }

  const specializations = await QuestSpecializationFilter.findAll({
    where: { questId: quest.id }
  });

  const recipients: string[] = [];

  for (const { industryKey, specializationKey } of specializations) {
    const where = {
      ...(payload.excludeWorkerIds && {
        userId: { [Op.notIn]: payload.excludeWorkerIds }
      }),
      specializationKey,
      industryKey,
    }

    const count = await UserSpecializationFilter.count({ where });

    for (let offset = 0; offset <= count; offset += 100) {
      const users = await UserSpecializationFilter.findAll({
        order: [['createdAt', 'ASC']],
        attributes: ['userId'],
        limit: 100,
        offset,
        where
      });

      recipients.push(...users.map(({ userId }) => userId));
    }
  }

  if (recipients.length) {
    brokerController.sendQuestNotification({
      action: QuestNotificationActions.newQuestForSpecialization,
      recipients: [...new Set(recipients)],
      data: quest
    });
  }
}
