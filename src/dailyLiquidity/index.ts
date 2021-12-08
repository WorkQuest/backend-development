import { initDatabase } from "@workquest/database-models/lib/models";
import * as path from "path";
import * as fs from "fs";
import Web3 from "web3";

import config from "../dailyLiquidity/config/config.dailyLiquidity";
import { ControllerDailyLiquidity, Web3ProviderHelper } from "./src/api/dailyLiquidity";

export async function init() {
  console.log('Start to grab daily liquidity');

  await initDatabase(config.dbLink, true, true);

  const abiFilePath = path.join(__dirname, '/abi/dailyLiquidityAbi.json');
  const abi: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi;
  const provider = config.bscNetwork.provider;
  const web3 = new Web3(provider);
  const contract = config.bscNetwork.contract;
  const tradeContract = new web3.eth.Contract(abi, contract);
  const helper = new Web3ProviderHelper(web3);
  const poolController = new ControllerDailyLiquidity(helper, tradeContract);
  await poolController.firstStart();

}

init().catch(console.log);




