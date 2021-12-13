import { EventData } from "web3-eth-contract";
import { Web3Helper } from "../providers/Web3Helper";
import { CoinGeckoProvider, Coins } from "../providers/CoinGeckoProvider";
import BigNumber from "bignumber.js";

export type Event = {
  timestamp: string | number;
  blockNumber: string | number;
}

export type SyncEvent = Event & {
  bnbPool: string;
  wqtPool: string;
}

export type Liquidity = SyncEvent & {
  usdPriceBNB: string;
  usdPriceWQT: string;
  liquidityPoolUSD: string;
}

export class ControllerDailyLiquidity {
  private readonly coinGeckoProvider: CoinGeckoProvider

  constructor(
    private readonly web3ProviderHelper: Web3Helper,
    private readonly dailyLiquidityContract: any,
  ) {
    this.coinGeckoProvider = new CoinGeckoProvider();
  }

  private async parseEvents(event: string, range: { blockTo: number, blockFrom: number, step: number }): Promise<EventData[]> {
    const events = [];

    let from = range.blockFrom;
    let to = range.blockFrom + range.step;

    while (to < range.blockTo) {
      const eventsData = await this.dailyLiquidityContract.getPastEvents(event, {
        fromBlock: from,
        toBlock: to,
      });

      events.push(...eventsData);

      from = to + 1;
      to += range.step;
      if (to > range.blockTo) {
        to = range.blockTo;
      }
    }

    return events;
  }

  private async processSyncEvent(event: EventData): Promise<SyncEvent> {
    const blockInfo = await this.web3ProviderHelper.web3.eth.getBlock(event.blockNumber);

    return {
      timestamp: blockInfo.timestamp,
      blockNumber: event.blockNumber,
      bnbPool: event.returnValues.reserve0,
      wqtPool: event.returnValues.reserve1,
    }
  }

  private async makeLiquidityBySyncEvent(syncEvent: SyncEvent): Promise<Liquidity> {
    const priceInfoWQTStartDay = await this.coinGeckoProvider.coinPriceInUSD(syncEvent.timestamp, Coins.WQT);
    const priceInfoBNBStartDay = await this.coinGeckoProvider.coinPriceInUSD(syncEvent.timestamp, Coins.BNB);

    const bnbPool = new BigNumber(syncEvent.bnbPool).shiftedBy(-18);
    const wqtPool = new BigNumber(syncEvent.wqtPool).shiftedBy(-18);

    const usdOfBnb = bnbPool.multipliedBy(priceInfoBNBStartDay);
    const usdOfWqt = wqtPool.multipliedBy(priceInfoWQTStartDay);

    const poolToken = usdOfBnb
        .plus(usdOfWqt)
        .toString()

    return {
      timestamp: syncEvent.timestamp,
      blockNumber: syncEvent.blockNumber,
      bnbPool: bnbPool.toString(),
      wqtPool: wqtPool.toString(),
      usdPriceWQT: priceInfoWQTStartDay.toString(),
      usdPriceBNB: priceInfoBNBStartDay.toString(),
      liquidityPoolUSD: poolToken
    }
  }

  private processSyncEvents(events: EventData[]): Promise<SyncEvent[]> {
    return Promise.all(events.map((event) => { return this.processSyncEvent(event) }));
  }

  private async makeLiquidityBySyncEvents(syncEvents: SyncEvent[]): Promise<Liquidity[]> {
    return Promise.all(syncEvents.map((syncEvent) => { return this.makeLiquidityBySyncEvent(syncEvent) } ));
  }

  public async collectLiquidityData(periodInDays: number): Promise<Liquidity[]> {
    const lastBlock = await this.web3ProviderHelper.web3.eth.getBlock('latest');

    const lastTimestampInMs = parseInt(lastBlock.timestamp) * 1000;

    const blockRangeFromDate = new Date(lastTimestampInMs - 86400000 * periodInDays);
    const blockRangeToDate = new Date(lastTimestampInMs);

    blockRangeFromDate.setHours(7,0,0,0);
    blockRangeToDate.setHours(6,59,59,999);

    const blockRangeFrom = await this.web3ProviderHelper.getBlockByDate(blockRangeFromDate);
    const blockRangeTo = await this.web3ProviderHelper.getBlockByDate(blockRangeToDate);

    const events = await this.parseEvents('Sync', {
      step: 2000,
      blockTo: blockRangeTo.block,
      blockFrom: blockRangeFrom.block
    });
    const syncEvents = ControllerDailyLiquidity.getFirstDayEvents(
      await this.processSyncEvents(events)
    ) as SyncEvent[];

    return this.makeLiquidityBySyncEvents(syncEvents);
  }

  public static getFirstDayEvents(events: Event[]): Event[] {
    const dayTimestampsMap: Map<number, Event[]> = new Map();

    for (const event of events) {
      const daySinceUnixEpoch = Math.trunc(parseInt(event.timestamp as string) / 86400);

      if (!dayTimestampsMap.has(daySinceUnixEpoch)) dayTimestampsMap.set(daySinceUnixEpoch, []);

      dayTimestampsMap
        .get(daySinceUnixEpoch)
        .push(event)
    }

    return Array
      .from(dayTimestampsMap.values())
      .map(_ => _.reduce((a, b) => a.timestamp < b.timestamp ? a : b ))
  }
}