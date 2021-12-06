import {addJob} from "../utils/scheduler";
import { ChatMember, DailyLiquidity } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"
import { Helpers } from "graphile-worker";
import Web3 from "web3";
import BigNumber from "bignumber.js";
import axios from "axios";
import * as path from "path";
import * as fs from "fs";
const EthDater = require('ethereum-block-by-date');
const providerBNB = 'wss://speedy-nodes-nyc.moralis.io/99c238c237fa12068a89c5c6/bsc/mainnet/ws'
const abiFilePath = path.join(__dirname,'../../../src/dailyLiquidity/abi/dailyLiquidityAbi.json');
console.log(abiFilePath);
const abiBNB: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi
const contractBNB = '0x3ea2de549ae9dcb7992f91227e8d6629a22c3b40'

export type UnreadMessageIncrementPayload = {
  chatId: string;
  notifierUserId?: string;
}

export async function cleanPoolDataJob(payload: UnreadMessageIncrementPayload) {
  return addJob("cleanPoolData", payload);
}

export default async function cleanPoolData(payload: UnreadMessageIncrementPayload, h: Helpers) {


  const netStartDate = new Date(new Date().setUTCHours(0, 0, 0, 0)).toUTCString() //без обёртки в new Date() время будет в Unix - шедулер не заупстится
  await addJob('cleanPoolData', {  }, { 'run_at': netStartDate})
}

