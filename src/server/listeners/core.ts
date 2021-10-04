/**
import { AbiItem, } from 'web3-utils';
import { Contract } from "@ethersproject/contracts";
import { networks, wsProviders } from "../config/constant";

const options = {
  clientConfig: {
    maxReceivedFrameSize: 100000000,
    maxReceivedMessageSize: 100000000,
  },
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 15,
    onTimeout: false,
  },
};

const Web3 = require('web3');

const web3 = {};

export const initWeb3 = (): void => {
  for (const [network, provider] of Object.entries(wsProviders)) {
    const providerWS = new Web3.providers.WebsocketProvider(provider, options);
    web3[networks[network]] = new Web3(providerWS);
  }
};

export const createContract = (Abi: AbiItem[], address: string, network: string)
  : Contract => (new web3[network].eth.Contract(Abi, address));

export const getBlockNumber = async (network: string)
  : Promise<number> => await web3[network].eth.getBlockNumber();

 */
