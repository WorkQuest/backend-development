import {addJob} from "../utils/scheduler";
import {Quest, QuestRaiseStatus, QuestRaiseType, QuestRaiseView} from "@workquest/database-models/lib/models";
import { Helpers } from "graphile-worker";

export type QuestRaiseViewPayload = {
  questId: string,
  status: QuestRaiseStatus,
  type: QuestRaiseType
}

//payload: QuestRaiseViewPayload

export async function updateQuestRaiseViewStatusJob() {
  //return addJob("updateQuestRaiseViewStatus", payload);
  return addJob("updateQuestRaiseViewStatus");
}
//payload: QuestRaiseViewPayload
export default async function updateQuestRaiseViewStatus(payload,h: Helpers) {
  const endOfRaiseView = new Date();
  const a = endOfRaiseView.setTime(1643274960*1000)
  console.log(new Date(a));
  endOfRaiseView.setDate(endOfRaiseView.getDate() + 1);

  console.log("HELLO");
  await h.addJob('test', {}, {runAt: endOfRaiseView})
  // await QuestRaiseView.update({ status: payload.status }, { where: { questId: payload.questId } });
  // await Quest.update({adType: QuestRaiseType}, {where: {id: payload.questId}});


}

