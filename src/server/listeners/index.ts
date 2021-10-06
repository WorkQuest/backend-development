import {Server,} from '@hapi/hapi';
import { contractAddresses, networks } from "../config/constant";
import { createContract, getBlockNumber } from "./core";
import { WQBridge } from "../abi/WQBridge";
import { BlockchainNetworks, BridgeParserBlockInfo } from "@workquest/database-models/lib/models";
import { normalizeEventData, parseEvents, subscribeAllEvents } from "./misc";
import processSwapInitialized, { swapInitializedReadInterface } from "../jobs/processSwapInitialized";
import processSwapRedeemed, { swapRedeemedReadInterface } from "../jobs/processSwapRedeemed";

const contractEventsBridge = {
  swapInitialized: 'SwapInitialized',
  swapRedeemed: 'SwapRedeemed',
}

export const listenerBridge = async (server: Server, network ): Promise<void> => {
  const blockchainNetwork = (network === 'ETH' ? BlockchainNetworks.ethMainNetwork : BlockchainNetworks.bscMainNetwork);
  const [key] = Object.entries(networks).find(([, val]) => val === network);
  const contract : any = createContract(WQBridge, contractAddresses[key], network);
  console.log('\x1b[32m%s\x1b[0m', 'Subscribed contract * WQ Bridge * | network:', network);

  const eventData = async (data, isWs = true) => {
    if(isWs){
      const lastBlock = await getBlockNumber(network);

      await BridgeParserBlockInfo.update({ lastParsedBlock: lastBlock }, {
        where: { network: blockchainNetwork }
      });
    }
    switch (data.event) {
      case contractEventsBridge.swapInitialized: {
        console.log(contractEventsBridge.swapInitialized)
        const swapInitializedData = <swapInitializedReadInterface>normalizeEventData(data);
        const res = await processSwapInitialized(swapInitializedData, blockchainNetwork);
        break;
      }
      case contractEventsBridge.swapRedeemed: {
        console.log(contractEventsBridge.swapRedeemed)
        const swapRedeemedData = <swapRedeemedReadInterface>normalizeEventData(data);
        const res = await processSwapRedeemed(swapRedeemedData, blockchainNetwork);
        break;
      }
      default:
        console.log(`Another event Bridge ${network} ${data.event}.`);
    }
  };

  const [parserInfo, ] = await BridgeParserBlockInfo.findOrCreate({
    where: { network: blockchainNetwork },
    defaults: { network: blockchainNetwork },
  });

  const fromBlock = parserInfo.lastParsedBlock + 1;

  console.log('\x1b[35m%s\x1b[0m', `fromBlock: '${fromBlock}' | parseEvents Bridge started!!!`);

  await parseEvents({
    network,
    fromBlock,
    parseCallback: eventData,
    contract,
    events: Object.values({}),
  });

  const lastBlock = await getBlockNumber(network);

  subscribeAllEvents({
    fromBlock: lastBlock,
    callbackFunc: eventData,
    events: contract.events
  })

  if (lastBlock > fromBlock) {
    await BridgeParserBlockInfo.update({ lastParsedBlock: lastBlock }, {
      where: { network: blockchainNetwork }
    });
  }
};
