import { networks } from "../config/constant";
import { getBlockNumber } from "./core";
import {Contract, EventData,} from 'web3-eth-contract';
import BigNumber from 'bignumber.js';
import { Server } from '@hapi/hapi';
import { getSwapsTake } from '../api/swaps';

/** Types */
export type UInt = number | BigNumber;

// eslint-disable-next-line @typescript-eslint/ban-types
export const normalizeEventData = (data: EventData, isEntity = true): object => {
  const fields = {};

  Object.entries(isEntity ? data.returnValues : data)
    .filter(([key]) => Number.isNaN(Number(key)))
    .forEach(([key, val]) => {
      fields[key] = val;
    });

  if (!isEntity) {
    return {...fields,};
  }

  const dataQuery = {...data, ...fields,};

  // delete useless properties
  delete dataQuery.address;
  delete dataQuery.returnValues;
  delete dataQuery.raw;
  delete dataQuery.event;

  return dataQuery;
};

// export const wsSendSwaps = async (server: Server, recipient: string, isWs) => {
//   if (isWs) {
//     const { count, swaps } = await getSwapsTake(recipient, 100, 0);
//
//     server.publish(`/bridge/swaps/${recipient.toUpperCase()}`, { count, swaps });
//   }
// }

export const parseEvents = async (payload: ParseEventsInterface): Promise<void> => {
  if (payload.network === networks.bsc || payload.network === networks.eth) {
    const count = 6000;
    const latest = await getBlockNumber(payload.network);
    let {fromBlock,} = payload;
    for (let toBlock = fromBlock + count; toBlock <= latest + count; toBlock += count) {
      console.log('Pagination selective parse:', 'fromBlock', fromBlock, 'toBlock', toBlock <= latest ? toBlock : latest);
      for (const e of payload.events) {
        const items = await payload.contract.getPastEvents(e, {
          fromBlock,
          toBlock: toBlock <= latest ? toBlock : latest,
        });

        for (const item of items) {
          await payload.parseCallback(item, false);
        }
      }
      fromBlock = toBlock;
    }
    fromBlock = payload.fromBlock;
    for (let toBlock = fromBlock + count; toBlock <= latest + count; toBlock += count) {
      console.log('Pagination parse:', 'fromBlock', fromBlock, 'toBlock', toBlock <= latest ? toBlock : latest);
      let events = await payload.contract.getPastEvents('allEvents', {
        fromBlock,
        toBlock: toBlock <= latest ? toBlock : latest,
      })
      for (const event of events) {
        if (!(Object.values(payload.events).includes(event.event))) {
          await payload.parseCallback(event, false)
        }
      }
      fromBlock = toBlock;
    }
  } else {
    const toBlock = payload.toBlock || 'latest';

    for (const event of payload.events) {
      const items = await payload.contract.getPastEvents(event, {
        fromBlock: payload.fromBlock,
        toBlock,
      });

      for (const item of items) {
        await payload.parseCallback(item, false); // false meant doesn't need to send socket event!
      }
    }
    let events = await payload.contract.getPastEvents('allEvents', {fromBlock: payload.fromBlock})
    for (const event of events) {
      if (!(Object.values(payload.events).includes(event.event))) {
        await payload.parseCallback(event, false)
      }
    }
  }
};

type parseCallbackType = (data, isWs: boolean) => Promise<void>;

interface ParseEventsInterface {
  network: string,
  fromBlock: number,
  toBlock?: number | string,
  parseCallback: parseCallbackType,
  contract: Contract,
  events: string[],
}

interface SubscribeParamsInterface {
  fromBlock: number
  events: any,
  callbackFunc: (data) => void;
}

export const subscribeAllEvents = (params: SubscribeParamsInterface): void => {
  const {events, fromBlock, callbackFunc,} = params;

  events.allEvents({fromBlock,}, (err) => {
    if (err) {
      console.error('allEvents error, try again', err);
      subscribeAllEvents(params);
    }
  })
    .on('data', callbackFunc)
    .on('error', (err) => {
      console.log('eventError in subscribeAllEvents, try again', err);
      subscribeAllEvents(params);
    });
};
