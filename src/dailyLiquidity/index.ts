import { initDatabase } from "@workquest/database-models/lib/models";
import * as path from "path";
import * as fs from "fs";
import Web3 from "web3";

import config from "../dailyLiquidity/config/config.dailyLiquidity";
import { ControllerDailyLiquidity} from "./src/controllers/ControllerDailyLiquidity";
import {Web3Helper} from "./src/providers/Web3Helper";
import cron from 'node-cron';
const https = require('https')

export async function init() {
  console.log('Start to grab daily liquidity');

  await initDatabase(config.dbLink, true, true);

  const http_options = {
    keepAlive: true,
    timeout: 20000, // milliseconds,
    withCredentials: false,
  };

  const ws_options = {
    reconnect: {
      auto: true,
      delay: 10000, // ms
      onTimeout: false
    }
  }

  const abiFilePath = path.join(__dirname, '/abi/dailyLiquidityAbi.json');
  const abi: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi;
  const http_provider = config.bscNetwork.httpsProvider;
  const ws_provider = config.bscNetwork.wsProvider;
  const web3 = new Web3(new Web3.providers.WebsocketProvider(ws_provider, ws_options));
  //const web3 = new Web3(new Web3.providers.HttpProvider(http_provider, http_options));
  const contract = config.bscNetwork.contract;
  const tradeContract = new web3.eth.Contract(abi, contract);
  const helper = new Web3Helper(web3);
  const periodForFirstStart = 10;
  const poolController = new ControllerDailyLiquidity(helper, tradeContract, periodForFirstStart);
  await poolController.firstStart();


    cron.schedule('0 0 * * *', async () => { //every day at 12 AM
      await poolController.startPerDay();
    });
}

init().catch(console.log);




