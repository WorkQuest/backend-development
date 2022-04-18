import { error } from '../utils';
import { Errors } from '../utils/errors';
import { QuestChatController } from '../controllers/chat/controller.chat';
import {
  Chat,
  User,
  UserRole,
  QuestChat,
  ChatMember,
  MemberType,
} from '@workquest/database-models/lib/models';

export class QuestChatControllerFactory {
  public static async createByQuestResponseId(id: string) {
    const chat = await Chat.findOne({
      include: [{
        model: QuestChat,
        as: 'questChat',
        where: { responseId: id },
        required: true,
      }, {
        model: ChatMember,
        as: 'members',
        where: { type: MemberType.User },
        include: [{
          model: User.scope('shortWithAdditionalInfo'),
          as: 'user',
        }]
      }],
    });

    if (!chat) {
      throw error(Errors.NotFound, 'Quest chat not found by response id', { responseId: id });
    }

    const workerMember = chat.members.find(member => member.user.role === UserRole.Worker);
    const employerMember = chat.members.find(member => member.user.role === UserRole.Employer);

    return new QuestChatController(chat, chat.questChat, {
      worker: workerMember,
      employer: employerMember,
    });
  }
}

export class GroupChatControllerFactory {
  
}
