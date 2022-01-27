import {addJob} from "../utils/scheduler";
import {Quest, QuestRaiseStatus, QuestRaiseType, QuestRaiseView} from "@workquest/database-models/lib/models";

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
export default async function updateQuestRaiseViewStatus() {
  addJob('update', {}, {})

  // await QuestRaiseView.update({ status: payload.status }, { where: { questId: payload.questId } });
  // await Quest.update({adType: QuestRaiseType}, {where: {id: payload.questId}});


}

