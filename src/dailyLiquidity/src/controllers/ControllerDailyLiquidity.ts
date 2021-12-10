import { EventData } from "web3-eth-contract";
import { Web3Helper } from "../providers/Web3Helper";
import { CoinGeckoProvider, Coins } from "../providers/CoinGeckoProvider";
import BigNumber from "bignumber.js";
import { DailyLiquidity } from "@workquest/database-models/lib/models";
import { Op } from "sequelize";

export type blockInfo = {
  timestamp: number,
  blockNumber: string,
  bnbPool: string,
  wqtPool: string,
}

export class ControllerDailyLiquidity {
  private readonly coinGeckoProvider: CoinGeckoProvider

  constructor(
    private readonly web3ProviderHelper: Web3Helper,
    private readonly dailyLiquidityContract: any,
    private readonly period: number,
  ) {
    this.coinGeckoProvider = new CoinGeckoProvider();
  }

  private async parseLastEvents(result: any): Promise<Array<EventData[]>> {
    const eventsSync = [];
    let firstBlock: number = result[0].block //first block in 10 days ago
    const lastBlock: number = result[1].block //last block yesterday
    let step = 2000;
    let blockNumber = firstBlock + step;
    while (blockNumber <= lastBlock) {
      const eventsData = await this.dailyLiquidityContract.getPastEvents('Sync', {
        fromBlock: firstBlock,
        toBlock: blockNumber,
      });
      eventsSync.push(...eventsData);
      if (blockNumber === lastBlock) {
        break;
      }
      firstBlock = blockNumber + 1;
      blockNumber += step;
      if (blockNumber > lastBlock) {
        blockNumber = lastBlock;
      }
    }
    return eventsSync;
  }

  private getTimestampDates(periodStart: number) {
    const daysStart = [];
    const daysEnd = [];
    const start = new Date(periodStart * 1000);
    for (let day = 0; day < this.period; day++) {
      let date = new Date(periodStart * 1000);
      let startDay = new Date(date.setDate(start.getDate() + day)).setHours(7, 0, 0, 0);
      date = new Date(periodStart * 1000);
      let endDay = new Date(date.setDate(start.getDate() + (day + 1))).setHours(6, 59, 59, 999);
      daysStart.push(Number(startDay) / 1000);
      daysEnd.push(Number(endDay) / 1000);
    }
    const result = [];
    result.push(daysStart);
    result.push(daysEnd);
    return result;
  }

  private async countPool() {
    const endOfEachDays = await DailyLiquidity.findAll();
    for (let i = 0; i < endOfEachDays.length; i++) {
      const priceInfoWQTStartDay = await this.coinGeckoProvider.coinPriceInUSD(Number(endOfEachDays[i].timestamp), Coins.WQT);
      const priceInfoBNBStartDay = await this.coinGeckoProvider.coinPriceInUSD(Number(endOfEachDays[i].timestamp), Coins.BNB);
      const poolToken = Number((Number(endOfEachDays[i].bnbPool) * priceInfoBNBStartDay)) + Number((Number(endOfEachDays[i].wqtPool) * priceInfoWQTStartDay));
      await endOfEachDays[i].update({
        usdPriceWQT: priceInfoWQTStartDay,
        usdPriceBNB: priceInfoBNBStartDay,
        liquidityPoolUSD: poolToken
      });
    }
  }

  private async processEvents(eventsSync: any): Promise<Array<blockInfo>> {
    const allData = [];
    for (let i = 0; i < eventsSync.length; i++) {
      const token0 = Number(new BigNumber(eventsSync[i].returnValues.reserve0).shiftedBy(-18));
      const token1 = Number(new BigNumber(eventsSync[i].returnValues.reserve1).shiftedBy(-18));
      const blockInfo = await this.web3ProviderHelper.web3.eth.getBlock(eventsSync[i].blockNumber);
      const timestamp = Number(blockInfo.timestamp);
      const data = {
        timestamp: timestamp,
        blockNumber: eventsSync[i].blockNumber,
        bnbPool: token0,
        wqtPool: token1,
      }
      allData.push(data);
    }
    return allData;
  }

  static async cleanData(blockInfos: blockInfo[]) {
    const blockByDays = new Map();
    for (let i = 0; i < blockInfos.length; i ++) {
      const day = Math.trunc(blockInfos[i].timestamp/86400)
      if (!blockByDays.has(day)) {
        blockByDays.set(day, []);
      }
      blockByDays.get(day).push(blockInfos[i]);
    }
    for (let day of blockByDays) {
      const index = day[1].length - 1
      const lastBlockInTheDay = day[1][index]
      await DailyLiquidity.create(lastBlockInTheDay);
    }
  }

  public async firstStart() {
    let lastBlockTimestamp = Number( (await this.web3ProviderHelper.web3.eth.getBlock('latest')).timestamp + "000");
    let lastBlockTimestampUTC = new Date(lastBlockTimestamp);
    let startDayFromDate, endDayToDate;
    startDayFromDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 10)).setHours(7,0,0,0)); //10 days ago start
    endDayToDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate())).setHours(6,59,59,999)); //previous day end
    const result = await this.web3ProviderHelper.getDailyBlocks(startDayFromDate, endDayToDate);
    const dates = await this.parseLastEvents(result)
    const blockInfos = await this.processEvents(dates);
    await ControllerDailyLiquidity.cleanData(blockInfos);
    await this.countPool();
  }

  public async startPerDay() {
    let lastBlockTimestamp = Number( (await this.web3ProviderHelper.web3.eth.getBlock('latest')).timestamp + "000");
    let lastBlockTimestampUTC = new Date(lastBlockTimestamp);
    let startDayFromDate, endDayToDate;
    startDayFromDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 1)).setHours(7,0,0,0));
    endDayToDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate())).setHours(6,59,59,999));
    const result = await this.web3ProviderHelper.getDailyBlocks(startDayFromDate, endDayToDate);
    const dates = await this.parseLastEvents(result)
    const blockInfos = await this.processEvents(dates);
    await ControllerDailyLiquidity.cleanData(blockInfos);
    const dailyInfo = await DailyLiquidity.findOne({
      order: [['createdAt', 'DESC']]
    })
    const priceInfoWQTStartDay = await this.coinGeckoProvider.coinPriceInUSD(Number(dailyInfo.timestamp), Coins.WQT);
    const priceInfoBNBStartDay = await this.coinGeckoProvider.coinPriceInUSD(Number(dailyInfo.timestamp), Coins.BNB);
    const poolToken = Number((Number(dailyInfo.bnbPool) * priceInfoBNBStartDay)) + Number((Number(dailyInfo.wqtPool) * priceInfoWQTStartDay));
    await dailyInfo.update({
      usdPriceWQT: priceInfoWQTStartDay,
      usdPriceBNB: priceInfoBNBStartDay,
      liquidityPoolUSD: poolToken
    });
  }
}
