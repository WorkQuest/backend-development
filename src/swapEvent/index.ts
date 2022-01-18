import Web3 from "web3";
import * as fs from "fs";
import * as path from "path";
import { Web3Helper } from "./src/providers/Web3Helper";
import { WqtWbnbSwapEven } from "@workquest/database-models/lib/models";
import { initDatabase } from "@workquest/database-models/lib/models";
import configDatabase from "./config/config.database";
import configWqtWbnbSwap from "./config/config.swapParser";
import { SwapEventController } from "./src/controllers/SwapEventController";

const abiFilePath = path.join(__dirname, '/abi/swapEvent.json');
const abi: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi;

export async function init() {
  await initDatabase(configDatabase.dbLink, true, true);

  const websocketProvider = new Web3.providers.WebsocketProvider(configWqtWbnbSwap.wsProvider, {
    reconnect: {
      auto: true,
      delay: 10000,
      onTimeout: false
    }
  });

  const web3 = new Web3(websocketProvider);
  const web3Helper = new Web3Helper(web3);

  const swapEventContract = new web3.eth.Contract(abi, configWqtWbnbSwap.contractAddress);

  const swapEvent = new SwapEventController(web3Helper, swapEventContract);

  const lastBlock = await WqtWbnbSwapEven.findOne({
    order: [["createdAt", "DESC"]]
  });


  if (lastBlock) {
    await swapEvent.processBlockInfo('Swap', lastBlock.blockNumber + 1);
  } else {
    await swapEvent.processBlockInfo('Swap', configWqtWbnbSwap.lastBlockNumber - 1);
  }

  await swapEvent.subscribeOnEvent();
}

init().catch(console.error);




