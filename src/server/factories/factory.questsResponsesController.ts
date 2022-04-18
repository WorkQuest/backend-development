import { error } from '../utils';
import { Errors } from '../utils/errors';
import { QuestsResponse, Quest, User } from '@workquest/database-models/lib/models';
import { QuestResponseController, QuestsInviteController } from '../controllers/quest/controller.questResponses';

export class QuestResponseControllerFactory {
  public static async createById(id: string): Promise<QuestResponseController| never> {
    const questResponse = await QuestsResponse.findByPk(id, {
      include: [{
        model: Quest,
        as: 'quest'
      }, {
        model: User,
        as: 'worker'
      }],
    });

    if (!questResponse) {
      throw error(Errors.NotFound, 'Quest response not found', { id });
    }

    return new QuestResponseController(
      questResponse.quest,
      questResponse.worker,
      questResponse,
    );
  }
}

export class QuestInviteControllerFactory {
  public static async createById(id: string): Promise<QuestsInviteController | never> {
    const questInvite = await QuestsResponse.findByPk(id, {
      include: [{
        model: Quest,
        as: 'quest'
      }, {
        model: User,
        as: 'worker'
      }],
    });

    if (!questInvite) {
      throw error(Errors.NotFound, 'Quest invite not found', { id });
    }

    return new QuestsInviteController(
      questInvite.quest,
      questInvite.worker,
      questInvite,
    );
  }
}
