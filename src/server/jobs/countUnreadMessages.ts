import { addJob } from "../utils/scheduler";
import { Message, Chat, ChatMember } from "@workquest/database-models/lib/models";
import { error } from "../utils";
import { Errors } from "../utils/errors";
import { Op } from "sequelize";

export interface Data{
  messageId: string,
  chatId: string,
  userId: string,
}

export async function countUnreadMessagesJob(payload: Data) {
  return addJob("countUnreadMessages", payload);
}

export default async function countUnreadMessages(payload: Data) {
  const chatMember = await ChatMember.findOne({
    where: {
      userId: payload.userId,
      chatId: payload.chatId,
    },
    include: {
      model: Message.unscoped(),
      as: 'lastReadMessage',
      attributes: ["createdAt"]
    }
  });

  if(chatMember.lastReadMessageId !== payload.messageId){
    const message = await Message.findByPk(payload.messageId);
    console.log(chatMember.lastReadMessage.createdAt)
    const messages = await Message.findAndCountAll({
      where: {
        createdAt: {
          [Op.between]: [message.createdAt, chatMember.lastReadMessage.createdAt]
        }
      }
    });
    await chatMember.update({
      unreadCountMessages: chatMember.unreadCountMessages - messages.count + 1,
      lastReadMessageId: payload.messageId
    });
  }else{
    await chatMember.update({
      unreadCountMessages: 0,
    });
  }

}

