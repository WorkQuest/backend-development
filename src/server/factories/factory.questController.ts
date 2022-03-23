import { error } from '../utils';
import { Errors } from '../utils/errors';
import { Quest } from '@workquest/database-models/lib/models';
import { QuestController } from "../controllers/quest/controller.quest";

export class QuestControllerFactory {
  public static async createById(id: string): Promise<QuestController | never> {
    const quest = await Quest.findByPk(id);

    if (!quest) {
      throw error(Errors.NotFound, 'Quest not found', { id });
    }

    return new QuestController(quest);
  }

  public static async createByModel(quest: Quest): Promise<QuestController> {
    return new QuestController(quest);
  }

  public static async createByContractAddress(address: string): Promise<QuestController | never> {
    const quest = await Quest.findOne({
      where: { contractAddress: address.toLowerCase() },
    });

    if (!quest) {
      throw error(Errors.NotFound, 'Quest not found by contract address', { address });
    }

    return new QuestController(quest);
  }
}
