import * as path from "path";
import * as fs from "fs";
import config from "../server/config/config";
import {BridgeContract} from "./src/BridgeContract";
import {BridgeEthListener, BridgeBnbListener} from "./src/BridgeListener";
import {WebsocketProvider} from "web3-core";
import {BridgeProvider} from "./src/BridgeProvider";

const abiFilePath = path.join(__dirname, './abi/liquidityMiningAbi.json');
const abi: string = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi;

const contractEthAddress = config.bridge.debug ? config.bridge.rinkebyTestNetwork.contract : config.bridge.ethereumMainNetwork.contract;
const urlEthProvider = config.bridge.debug ? config.bridge.rinkebyTestNetwork.webSocketProvider : config.bridge.ethereumMainNetwork.webSocketProvider;
const contractBscAddress = config.bridge.debug ? config.bridge.bscTestNetwork.contract : config.bridge.bscTestNetwork.contract;
const urlBscProvider = config.bridge.debug ? config.bridge.bscTestNetwork.webSocketProvider : config.bridge.bscTestNetwork.webSocketProvider;

const wsEthProvider = new WebsocketProvider(urlEthProvider);
const wsBscProvider = new WebsocketProvider(urlBscProvider);

const bridgeEthProvider = BridgeProvider.buildBridgeProvider(wsEthProvider, 'eth', 500);
const bridgeBnbProvider = BridgeProvider.buildBridgeProvider(wsBscProvider, 'bnb', 500);

const bridgeEthContract = new BridgeContract(bridgeEthProvider, contractEthAddress, abi);
const bridgeBnbContract = new BridgeContract(bridgeBnbProvider, contractBscAddress, abi);

const bridgeEthListener = new BridgeEthListener(bridgeEthContract);
const bridgeBnbListener = new BridgeBnbListener(bridgeBnbContract);

bridgeEthListener.startListen();
bridgeBnbListener.startListen();

