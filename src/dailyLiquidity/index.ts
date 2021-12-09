import { initDatabase } from "@workquest/database-models/lib/models";
import * as path from "path";
import * as fs from "fs";
import Web3 from "web3";

import config from "../dailyLiquidity/config/config.dailyLiquidity";
import { ControllerDailyLiquidity, Web3ProviderHelper } from "./src/api/dailyLiquidity";
import cron from 'node-cron';
const https = require('https')

export async function init() {
  console.log('Start to grab daily liquidity');

  await initDatabase(config.dbLink, true, true);

  const abiFilePath = path.join(__dirname, '/abi/dailyLiquidityAbi.json');
  const abi: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi;
  const httpProvider = config.bscNetwork.httpsProvider;
  const wsProvider = config.bscNetwork.wsProvider;
  const web3 = new Web3(new Web3.providers.WebsocketProvider(wsProvider));
  //const web3 = new Web3(new Web3.providers.HttpProvider(httpProvider));
/*  let a = await web3.eth.getBlockNumber();
  let b = await web3.eth.getBlock(a);
  console.log((await web3.eth.getBlock(a)).timestamp);
  console.log(b);*/
  //console.log(b.timestamp);
  const contract = config.bscNetwork.contract;
  const tradeContract = new web3.eth.Contract(abi, contract);
  const helper = new Web3ProviderHelper(web3);
  const poolController = new ControllerDailyLiquidity(helper, tradeContract);
  await poolController.firstStart();

  cron.schedule('* * 0 * * *', async () => {
    await poolController.startPerDay();
  });
}

init().catch(console.log);




