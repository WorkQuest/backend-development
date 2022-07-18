import { addJob } from "../utils/scheduler";
import {
  ChatData,
} from "@workquest/database-models/lib/models";

export type UpdateChatDataPayload = {
  chatId: string;
  lastMessageId: string;
};

export async function updateChatDataJob(payload: UpdateChatDataPayload) {
  return addJob('updateChatData', payload);
}

export default async function updateChatData(payload: UpdateChatDataPayload) {
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
