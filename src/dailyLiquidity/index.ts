/*
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
const abiBNB: any = [
  {"inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor"}, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {
      "indexed": true,
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }, {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "Approval",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "sender", "type": "address"}, {
      "indexed": false,
      "internalType": "uint256",
      "name": "amount0",
      "type": "uint256"
    }, {"indexed": false, "internalType": "uint256", "name": "amount1", "type": "uint256"}, {
      "indexed": true,
      "internalType": "address",
      "name": "to",
      "type": "address"
    }],
    "name": "Burn",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "sender", "type": "address"}, {
      "indexed": false,
      "internalType": "uint256",
      "name": "amount0",
      "type": "uint256"
    }, {"indexed": false, "internalType": "uint256", "name": "amount1", "type": "uint256"}],
    "name": "Mint",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "sender", "type": "address"}, {
      "indexed": false,
      "internalType": "uint256",
      "name": "amount0In",
      "type": "uint256"
    }, {"indexed": false, "internalType": "uint256", "name": "amount1In", "type": "uint256"}, {
      "indexed": false,
      "internalType": "uint256",
      "name": "amount0Out",
      "type": "uint256"
    }, {"indexed": false, "internalType": "uint256", "name": "amount1Out", "type": "uint256"}, {
      "indexed": true,
      "internalType": "address",
      "name": "to",
      "type": "address"
    }],
    "name": "Swap",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{
      "indexed": false,
      "internalType": "uint112",
      "name": "reserve0",
      "type": "uint112"
    }, {"indexed": false, "internalType": "uint112", "name": "reserve1", "type": "uint112"}],
    "name": "Sync",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {
      "indexed": true,
      "internalType": "address",
      "name": "to",
      "type": "address"
    }, {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "Transfer",
    "type": "event"
  }, {
    "constant": true,
    "inputs": [],
    "name": "DOMAIN_SEPARATOR",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "MINIMUM_LIQUIDITY",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "PERMIT_TYPEHASH",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [{"internalType": "address", "name": "", "type": "address"}, {
      "internalType": "address",
      "name": "",
      "type": "address"
    }],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}],
    "name": "burn",
    "outputs": [{"internalType": "uint256", "name": "amount0", "type": "uint256"}, {
      "internalType": "uint256",
      "name": "amount1",
      "type": "uint256"
    }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "factory",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "getReserves",
    "outputs": [{"internalType": "uint112", "name": "_reserve0", "type": "uint112"}, {
      "internalType": "uint112",
      "name": "_reserve1",
      "type": "uint112"
    }, {"internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [{"internalType": "address", "name": "_token0", "type": "address"}, {
      "internalType": "address",
      "name": "_token1",
      "type": "address"
    }],
    "name": "initialize",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "kLast",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "liquidity", "type": "uint256"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "nonces",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }, {"internalType": "uint256", "name": "value", "type": "uint256"}, {
      "internalType": "uint256",
      "name": "deadline",
      "type": "uint256"
    }, {"internalType": "uint8", "name": "v", "type": "uint8"}, {
      "internalType": "bytes32",
      "name": "r",
      "type": "bytes32"
    }, {"internalType": "bytes32", "name": "s", "type": "bytes32"}],
    "name": "permit",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "price0CumulativeLast",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "price1CumulativeLast",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}],
    "name": "skim",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [{"internalType": "uint256", "name": "amount0Out", "type": "uint256"}, {
      "internalType": "uint256",
      "name": "amount1Out",
      "type": "uint256"
    }, {"internalType": "address", "name": "to", "type": "address"}, {
      "internalType": "bytes",
      "name": "data",
      "type": "bytes"
    }],
    "name": "swap",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [],
    "name": "sync",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "token0",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "token1",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "constant": false,
    "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {
      "internalType": "address",
      "name": "to",
      "type": "address"
    }, {"internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const contractBNB = '0x3ea2de549ae9dcb7992f91227e8d6629a22c3b40'
export async function init() {
  console.log('Start to grab daily liquidity');

  await initDatabase(configDatabase.dbLink, true, true);

}

init().catch(error => { /!** TODO *!/ });



*/