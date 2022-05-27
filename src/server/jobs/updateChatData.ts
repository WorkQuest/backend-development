import { Op } from "sequelize";
import { addJob } from "../utils/scheduler";
import {
  ChatData,
  Message,
} from "@workquest/database-models/lib/models";

export type UpdateCountUnreadChatsPayload = {
  chatId: string;
  lastMessageId: string;
};

export async function updateChatDataJob(payload: UpdateCountUnreadChatsPayload) {
  return addJob('updateChatData', payload);
}

export default async function updateChatData(payload: UpdateCountUnreadChatsPayload) {
  const [chatData, isCreated] = await ChatData.findOrCreate({
    where: {
      chatId: payload.chatId
    },
    defaults: {
      chatId: payload.chatId,
      lastMessageId: payload.lastMessageId
    }
  });

  if (!isCreated) {
    await chatData.update({ lastMessageId: payload.lastMessageId });
  }


}
