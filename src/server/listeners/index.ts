import {Server,} from '@hapi/hapi';
import { contractAddresses, networks } from "../config/constant";
import { createContract, getBlockNumber } from "./core";
import { WQBridge } from "../abi/WQBridge";
import { ParserBlockInfo } from "@workquest/database-models/lib/models";
import { normalizeEventData, parseEvents, subscribeAllEvents } from './misc';
import processSwapInitialized, { swapInitializedReadInterface } from "../jobs/processSwapInitialized";
import processSwapRedeemed, { swapRedeemedReadInterface } from "../jobs/processSwapRedeemed";

const contractEventsBridge = {
  swapInitialized: 'SwapInitialized',
  swapRedeemed: 'SwapRedeemed',
}

export const listenerBridge = async (server: Server, network ): Promise<void> => {
  const [key] = Object.entries(networks).find(([, val]) => val === network);
  const contract : any = createContract(WQBridge, contractAddresses[key], network);
  console.log('\x1b[32m%s\x1b[0m', 'Subscribed contract * WQ Bridge * | network:', network);

  const eventData = async (data, isWs = true) => {
    if(isWs){
      const lastBlock = await getBlockNumber(network);
      await ParserBlockInfo.update({'lastParsedBlock': lastBlock,}, {where: {network, contract: 'Bridge'},});
    }
    switch (data.event) {
      case contractEventsBridge.swapInitialized: {
        console.log(contractEventsBridge.swapInitialized)
        const swapInitializedData = <swapInitializedReadInterface>normalizeEventData(data)
        const res = await processSwapInitialized(swapInitializedData)
        // await wsSendSwaps(server, swapInitializedData.recipient.toLowerCase(), isWs)
        break;
      }
      case contractEventsBridge.swapRedeemed: {
        console.log(contractEventsBridge.swapRedeemed)
        const swapRedeemedData = <swapRedeemedReadInterface>normalizeEventData(data)
        const res = await processSwapRedeemed(swapRedeemedData)
        // await wsSendSwaps(server, swapRedeemedData.recipient.toLowerCase(), isWs)
        break;
      }
      default:
        console.log(`Another event Bridge ${network} ${data.event}.`);
    }
  };

  const fromBlock = (await ParserBlockInfo.findOrCreate({
    where: {network, contract: 'Bridge'},
  }))[0].lastParsedBlock + 1;
  console.log(fromBlock, 'fromBlock fromBlock fromBlock fromBlock fromBlock');

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
    await ParserBlockInfo.update({'lastParsedBlock': lastBlock,}, {where: {network, contract: 'Bridge'},});
  }
};