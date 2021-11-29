import {addJob} from "../utils/scheduler";
import { ChatMember, DailyLiquidity } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"
import { Helpers } from "graphile-worker";

export type UnreadMessageIncrementPayload = {
  chatId: string;
  notifierUserId?: string;
}

export async function cleanPoolDataJob(payload: UnreadMessageIncrementPayload) {
  return addJob("cleanPoolData", payload);
}

export default async function cleanPoolData(payload: UnreadMessageIncrementPayload, h: Helpers) {


  const fromTime = new Date().setUTCHours(0, 0, 0)
  const toTime = new Date().setUTCHours(23, 59, 0,0)
//clear
  const events = await DailyLiquidity.findAll({
    where: {
      timestamp: {
        [Op.between]: [1637791484, 1637802789]
      }
    }
  });

  console.log(events);

  const netStartDate = new Date(new Date().setUTCHours(24, 0, 0)).toUTCString() //без обёртки в new Date() время будет в Unix - шедулер не заупстится
  await addJob('cleanPoolData', {  }, { 'run_at': netStartDate})
}

