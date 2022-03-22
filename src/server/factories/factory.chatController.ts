import { error } from '../utils';
import { Errors } from '../utils/errors';
import { Chat, QuestChat } from '@workquest/database-models/lib/models';
import { QuestChatController } from '../controllers/chat/controller.questChat';

export class QuestChatControllerFactory {
  public static async createByQuestResponseId(id: string) {
    const chat = await Chat.findOne({
      include: {
        model: QuestChat,
        as: 'questChat',
        where: { responseId: id },
        required: true,
      }
    });

    if (!chat) {
      throw error(Errors.NotFound, 'Quest chat not found by response id', { responseId: id });
    }

    return new QuestChatController(chat, chat.questChat)
  }
}
