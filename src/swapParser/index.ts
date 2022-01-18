import Web3 from "web3";
import * as fs from "fs";
import * as path from "path";
import cron from 'node-cron';
import { Web3Helper } from "./src/providers/Web3Helper";
import { DailyLiquidity, SwapParser } from "@workquest/database-models/lib/models";
//import { ControllerDailyLiquidity} from "./src/controllers/ControllerDailyLiquidity";
import { initDatabase } from "@workquest/database-models/lib/models";
import configDatabase from "./config/config.database";
import configSwapParser from "./config/config.swapParser";
import { SwapParserController } from "./src/controllers/SwapParserController";

const abiFilePath = path.join(__dirname, '/abi/swapParser.json');
const abi: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi;

export async function init() {
  await initDatabase(configDatabase.dbLink, true, true);

  const websocketProvider = new Web3.providers.WebsocketProvider(configSwapParser.wsProvider, {
    reconnect: {
      auto: true,
      delay: 10000,
      onTimeout: false
    }
  });

  const web3 = new Web3(websocketProvider);
  const web3Helper = new Web3Helper(web3);

  const dailyLiquidityContract = new web3.eth.Contract(abi, configSwapParser.contractAddress);

  const swapParser = new SwapParserController(web3Helper, dailyLiquidityContract);

  const lastBlock = await SwapParser.findOne({
    order: [["createdAt", "DESC"]]
  });

  if (lastBlock) {
    await swapParser.processBlockInfo(Number(lastBlock.blockNumber+1));
  }

  await swapParser.subscribeOnEvent();
}

init().catch(console.error);




