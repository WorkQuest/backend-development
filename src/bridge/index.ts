import { BridgeContract } from "./src/BridgeContract";
import { BridgeListener } from "./src/BridgeListener";
import { WebsocketProvider } from "web3-core";
import { BridgeProvider } from "./src/BridgeProvider";

const wsProvider = new WebsocketProvider('');
const bridgeProvider = BridgeProvider.buildBridgeProvider(wsProvider, 'eth', 500);
const bridgeContract = new BridgeContract(bridgeProvider, '', '');

const bridgeListener = new BridgeListener(bridgeContract);

bridgeListener.startListen();
