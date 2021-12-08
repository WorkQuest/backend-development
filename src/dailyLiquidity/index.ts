
import * as path from "path";
import * as fs from "fs";
import Web3 from "web3";

//import configBridge from "../bridge/config/config.bridge";
//import configDatabase from "./config/config.database";
//import {BridgeContract} from "./src/BridgeContract";
//import {BridgeBscListener} from "../dailyLiquidity/src/";
import { initDatabase } from "@workquest/database-models/lib/models";
import configDatabase from "../bridge/config/config.database";
//import {BridgeProvider} from "./src/BridgeProvider";
//import { BridgeParserBlockInfo, BlockchainNetworks, initDatabase } from '@workquest/database-models/lib/models';

//const abiFilePath = path.join(__dirname, '/abi/liquidityMiningAbi.json');
const abi: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi;

//const parseEthEventsFromHeight = configBridge.debug ? configBridge.rinkebyTestNetwork.parseEventsFromHeight : configBridge.ethereumMainNetwork.parseEventsFromHeight;
//const contractEthAddress = configBridge.debug ? configBridge.rinkebyTestNetwork.contract : configBridge.ethereumMainNetwork.contract;
//const urlEthProvider = configBridge.debug ? configBridge.rinkebyTestNetwork.webSocketProvider : configBridge.ethereumMainNetwork.webSocketProvider;

//const parseBscEventsFromHeight = configBridge.debug ? configBridge.bscTestNetwork.parseEventsFromHeight : configBridge.bscMainNetwork.parseEventsFromHeight;
//const contractBscAddress = configBridge.debug ? configBridge.bscTestNetwork.contract : configBridge.bscMainNetwork.contract;
//const urlBscProvider = configBridge.debug ? configBridge.bscTestNetwork.webSocketProvider : configBridge.bscMainNetwork.webSocketProvider;*!/
const providerBNB = 'wss://speedy-nodes-nyc.moralis.io/99c238c237fa12068a89c5c6/bsc/mainnet/ws'

/**TODO*/
const contractBNB = '0x3ea2de549ae9dcb7992f91227e8d6629a22c3b40'
const provider = new Web3.providers.WebsocketProvider(providerBNB);
const tradeContract = new web3.eth.Contract(abiBNB, contractBNB);
export async function init() {
  console.log('Start to grab daily liquidity');

  await initDatabase(configDatabase.dbLink, true, true);

}

init().catch(error => { /!** TODO *!/ });




