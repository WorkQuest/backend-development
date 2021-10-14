import * as path from "path";
import * as fs from "fs";
import Web3 from "web3";
import config from "../server/config/config";
import {BridgeContract} from "./src/BridgeContract";
import {BridgeEthListener, BridgeBscListener} from "./src/BridgeListener";
import {BridgeProvider} from "./src/BridgeProvider";
import { BridgeParserBlockInfo, BlockchainNetworks, initDatabase } from '@workquest/database-models/lib/models';

const abiFilePath = path.join(__dirname, '/abi/liquidityMiningAbi.json');
const abi: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi;

const parseEthEventsFromHeight = config.bridge.debug ? config.bridge.rinkebyTestNetwork.parseEventsFromHeight : config.bridge.ethereumMainNetwork.parseEventsFromHeight;
const contractEthAddress = config.bridge.debug ? config.bridge.rinkebyTestNetwork.contract : config.bridge.ethereumMainNetwork.contract;
const urlEthProvider = config.bridge.debug ? config.bridge.rinkebyTestNetwork.webSocketProvider : config.bridge.ethereumMainNetwork.webSocketProvider;

const parseBscEventsFromHeight = config.bridge.debug ? config.bridge.bscTestNetwork.parseEventsFromHeight : config.bridge.bscMainNetwork.parseEventsFromHeight;
const contractBscAddress = config.bridge.debug ? config.bridge.bscTestNetwork.contract : config.bridge.bscMainNetwork.contract;
const urlBscProvider = config.bridge.debug ? config.bridge.bscTestNetwork.webSocketProvider : config.bridge.bscMainNetwork.webSocketProvider;

export async function init() {
  await initDatabase(config.dbLink, false, true);

  const web3Eth = new Web3(new Web3.providers.WebsocketProvider(urlEthProvider));
  const web3Bsc = new Web3(new Web3.providers.WebsocketProvider(urlBscProvider));

  const [ethBridgeInfo, ] = await BridgeParserBlockInfo.findOrCreate({
    where: { network: BlockchainNetworks.ethMainNetwork },
    defaults: {
      network: BlockchainNetworks.ethMainNetwork,
      lastParsedBlock: parseEthEventsFromHeight
    }
  });
  const [bcsBridgeInfo, ] = await BridgeParserBlockInfo.findOrCreate({
    where: { network: BlockchainNetworks.bscMainNetwork },
    defaults: {
      network: BlockchainNetworks.bscMainNetwork,
      lastParsedBlock: parseBscEventsFromHeight
    }
  });

  if (ethBridgeInfo.lastParsedBlock < parseEthEventsFromHeight) {
    ethBridgeInfo.lastParsedBlock = parseEthEventsFromHeight;

    await ethBridgeInfo.save();
  }
  if (bcsBridgeInfo.lastParsedBlock < parseBscEventsFromHeight) {
    bcsBridgeInfo.lastParsedBlock = parseBscEventsFromHeight;

    await bcsBridgeInfo.save();
  }

  const bridgeEthProvider = new BridgeProvider(web3Eth, 'eth', ethBridgeInfo.lastParsedBlock);
  const bridgeBscProvider = new BridgeProvider(web3Bsc, 'bsc', bcsBridgeInfo.lastParsedBlock);

  const bridgeEthContract = new BridgeContract(bridgeEthProvider, contractEthAddress, abi);
  const bridgeBscContract = new BridgeContract(bridgeBscProvider, contractBscAddress, abi);

  const bridgeEthListener = new BridgeEthListener(bridgeEthContract, ethBridgeInfo);
  const bridgeBscListener = new BridgeBscListener(bridgeBscContract, bcsBridgeInfo);

  await Promise.all([
    bridgeEthListener.preParseSwaps(),
    bridgeBscListener.preParseSwaps(),
  ]);

  await Promise.all([
    bridgeEthListener.start(),
    bridgeBscListener.start(),
  ]);
}

init().catch(error => { /** TODO */ });


