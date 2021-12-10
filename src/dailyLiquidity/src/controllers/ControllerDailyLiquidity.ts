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

  private async cleanData(firstBlockTimestamp: number) {
    const dates = this.getTimestampDates(firstBlockTimestamp);
    //оставляем только последнюю запись за 10 дней
    for (let i = 0; i < this.period; i++) {
      const dailyInfo = await DailyLiquidity.findAll({
        where: {
          timestamp: {
            [Op.between]: [dates[0][i], dates[1][i]]
          }
        },
        order: [["timestamp", "DESC"]]
      });
      await DailyLiquidity.destroy({
        where: {
          [Op.and]: [{
            id: { [Op.ne]: dailyInfo[0].id },
            timestamp: { [Op.between]: [dates[0][i], dates[1][i]] }
          }]
        }
      });
    }

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

  public async firstStart() {
    let lastBlockTimestamp = Number( (await this.web3ProviderHelper.web3.eth.getBlock('latest')).timestamp + "000");
    let lastBlockTimestampUTC = new Date(lastBlockTimestamp);
    let startDayFromDate, endDayToDate;
    startDayFromDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 10)).setHours(7,0,0,0)); //10 days ago start
    endDayToDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate())).setHours(6,59,59,999)); //previous day end
    const result = await this.web3ProviderHelper.getDailyBlocks(startDayFromDate, endDayToDate);
    const dates = await this.parseLastEvents(result)
    const blockInfos = await this.processEvents(dates);
    await DailyLiquidity.bulkCreate(blockInfos);
    await this.cleanData(blockInfos[0].timestamp);
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
    const dailyInfo = await DailyLiquidity.bulkCreate(blockInfos);
    await DailyLiquidity.destroy({
      where: {
        [Op.and]: [{
          id: { [Op.ne]: dailyInfo[dailyInfo.length-1].id },
          timestamp: { [Op.between]: [result[0].timestamp, result[1].timestamp] }
        }]
      }
    });
    const priceInfoWQTStartDay = await this.coinGeckoProvider.coinPriceInUSD(Number(dailyInfo[dailyInfo.length-1].timestamp), Coins.WQT);
    const priceInfoBNBStartDay = await this.coinGeckoProvider.coinPriceInUSD(Number(dailyInfo[dailyInfo.length-1].timestamp), Coins.BNB);
    const poolToken = Number((Number(dailyInfo[0].bnbPool) * priceInfoBNBStartDay)) + Number((Number(dailyInfo[dailyInfo.length-1].wqtPool) * priceInfoWQTStartDay));
    await dailyInfo[dailyInfo.length-1].update({
      usdPriceWQT: priceInfoWQTStartDay,
      usdPriceBNB: priceInfoBNBStartDay,
      liquidityPoolUSD: poolToken
    });
  }
}
