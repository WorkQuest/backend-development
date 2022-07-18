import { ControllerBroker, QuestNotificationActions } from '../controllers/controller.broker';
import {
  Quest,
  QuestSpecializationFilter,
  QuestStatus,
  UserSpecializationFilter
} from '@workquest/database-models/lib/models';

const brokerController = new ControllerBroker();

export interface SendNotificationAboutNewQuestPayload {
  questId: string
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

  for (const { industryKey, specializationKey } of specializations) {
    const count = await UserSpecializationFilter.count({
      where: { industryKey, specializationKey },
    });

    for (let offset = 0; offset <=  count; offset += 100) {
      const users = await UserSpecializationFilter.findAll({
        where: { industryKey, specializationKey },
        order: [['createdAt', 'ASC']],
        attributes: ['userId'],
        limit: 100,
        offset
      });

      brokerController.sendQuestNotification({
        action: QuestNotificationActions.newQuestForSpecialization,
        recipients: users.map(({ userId }) => userId),
        data: quest
      });
    }
  }
}