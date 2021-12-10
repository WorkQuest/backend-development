import BigNumber from "bignumber.js";
import axios from "axios";
import { DailyLiquidity } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"
import EthDater from 'ethereum-block-by-date';
import configDailyLiquidity from "../../config/config.dailyLiquidity";

export class Web3ProviderHelper {
  public readonly dater;
  constructor(
    public readonly web3: any,
  ) {
    this.web3 = web3;
    this.dater = new EthDater(web3);
  }

  public async getDailyBlocks(firstStart: boolean) {
    try {
      const result = [];
      const lastBlock = await this.web3.eth.getBlockNumber(); //get last block
      let lastBlockTimestamp = Number( (await this.web3.eth.getBlock(lastBlock)).timestamp + "000");
      let lastBlockTimestampUTC = new Date(lastBlockTimestamp);
      let startDayFromDate, endDayToDate, startOfTheDay, endOfTheDay;

      if(firstStart) {
        //получаем начало дня, до которого нужно будет считать
        startDayFromDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 10)).setHours(7,0,0,0)); //10 days ago start
        endDayToDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate())).setHours(6,59,59,999)); //previous day end
        startOfTheDay = await this.dater.getDate(startDayFromDate, true)
        endOfTheDay = await this.dater.getDate(endDayToDate, false)
      }else {
        startDayFromDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 1)).setHours(7,0,0,0));
        endDayToDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate())).setHours(6,59,59,999));
        startOfTheDay = await this.dater.getDate(startDayFromDate, true)
        endOfTheDay = await this.dater.getDate(endDayToDate, false)
      }
      result.push(startOfTheDay);
      result.push(endOfTheDay);
      return result;
    } catch (error) {
      console.log(error);
    }
  }
}

export class CoinGeckoProvider {
  private readonly api;
  constructor() {
    this.api =axios.create({
      baseURL: configDailyLiquidity.coinGecko.baseURL,
      headers: {
        "Accept": "application/json",
        'Content-Type': 'application/json',
      }
    });
  }
  async countUSD(timestamp: number, coin: 'wqt' | 'bnb') {
    try {
      if (coin === 'wqt') {
        return await this.api.get(`work-quest/market_chart/range?vs_currency=usd&from=${timestamp - 1800}&to=${timestamp + 1800}`, {
          timeout: 10000
        });
      } else {
        return await this.api.get(`binancecoin/market_chart/range?vs_currency=usd&from=${timestamp - 1800}&to=${timestamp + 1800}`, {
          timeout: 10000
        });
      }
    }catch (error) {
      console.log(error);
    }
  }
}

export class ControllerDailyLiquidity {
  private readonly coinGeckoProvider: CoinGeckoProvider

  constructor(
    private readonly web3ProviderHelper: Web3ProviderHelper,
    private readonly dailyLiquidityContract: any,
    private readonly period: number,
  ) {
    this.coinGeckoProvider = new CoinGeckoProvider();
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

  public async firstStart() {
    /*    const pool = await DailyLiquidity.findAll();
        if(pool) {
          return;
        }*/
    //TODO: protection for provider: make reconnect if connection is broke
    const eventsSync = [];
    const methodGetBlock = [];
    const allData = [];
    const result = await this.web3ProviderHelper.getDailyBlocks(true)
    let firstBlock: number = result[0].block //first block in 10 days ago
    const lastBlock: number = result[1].block //last block yesterday
    let step = 2000;
    let blockNumber = firstBlock + step;
    //собираем все блоки за 10 дней
    while (blockNumber <= lastBlock) {
      console.log(blockNumber);
      console.log(firstBlock, blockNumber);
      await this.dailyLiquidityContract.getPastEvents('Sync', {
        fromBlock: firstBlock,
        toBlock: blockNumber,
      }, function(error, event) {
        console.log(error);
        eventsSync.push(event)
      });
      for (let i = 0; i < eventsSync[0].length; i++) {
        const token0 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve0).shiftedBy(-18));
        const token1 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve1).shiftedBy(-18));
        await this.web3ProviderHelper.web3.eth.getBlock(eventsSync[0][i].blockNumber,
          function(error, events) {
            methodGetBlock.push(events)
          });
        const timestamp = Number(methodGetBlock[i].timestamp);
        const data = {
          timestamp: timestamp,
          blockNumber: eventsSync[0][i].blockNumber,
          bnbPool: token0,
          wqtPool: token1,
        }
        allData.push(data);
        console.log(data);
      }
      methodGetBlock.length = 0;
      eventsSync.length = 0;
      if (blockNumber === lastBlock) {
        break;
      }
      firstBlock = blockNumber + 1;
      blockNumber += step;
      if (blockNumber > lastBlock) {
        blockNumber = lastBlock;
      }
    }
    await DailyLiquidity.bulkCreate(allData);
    console.log("hi")

    //переведём начало и конец каждого из 10 дней в timestamp и соберём в массив
    const dates = this.getTimestampDates(result[0].timestamp);
    console.log(dates);
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
      const priceInfoWQTStartDay = await this.coinGeckoProvider.countUSD(Number(endOfEachDays[i].timestamp), "wqt");
      const priceInfoBNBStartDay = await this.coinGeckoProvider.countUSD(Number(endOfEachDays[i].timestamp), "bnb");
      const poolToken = Number((Number(endOfEachDays[i].bnbPool) * priceInfoBNBStartDay.data.prices[0][1])) + Number((Number(endOfEachDays[i].wqtPool) * priceInfoWQTStartDay.data.prices[0][1]));
      await endOfEachDays[i].update({
        usdPriceWQT: priceInfoWQTStartDay.data.prices[0][1],
        usdPriceBNB: priceInfoBNBStartDay.data.prices[0][1],
        liquidityPoolUSD: poolToken
      });
    }
  }

  public async startPerDay() {
    const eventsSync = [];
    const methodGetBlock = [];
    const allData = [];
    const result = await this.web3ProviderHelper.getDailyBlocks(false)
    let firstBlock: number = result[0].block //first block in 10 days ago
    const lastBlock: number = result[1].block //last block yesterday
    let step = 2000;
    let blockNumber = firstBlock + step;
    //собираем все блоки за 10 дней
    while (blockNumber <= lastBlock) {
      console.log(blockNumber);
      console.log(firstBlock, blockNumber);
      await this.dailyLiquidityContract.getPastEvents('Sync', {
        fromBlock: firstBlock,
        toBlock: blockNumber,
      }, function(error, event) {
        console.log(error);
        eventsSync.push(event)
      });
      for (let i = 0; i < eventsSync[0].length; i++) {
        const token0 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve0).shiftedBy(-18));
        const token1 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve1).shiftedBy(-18));
        await this.web3ProviderHelper.web3.eth.getBlock(eventsSync[0][i].blockNumber,
          function(error, events) {
            methodGetBlock.push(events)
          });
        const timestamp = Number(methodGetBlock[i].timestamp);
        const data = {
          timestamp: timestamp,
          blockNumber: eventsSync[0][i].blockNumber,
          bnbPool: token0,
          wqtPool: token1,
        }
        allData.push(data);
        console.log(data);
      }
      methodGetBlock.length = 0;
      eventsSync.length = 0;
      if (blockNumber === lastBlock) {
        break;
      }
      firstBlock = blockNumber + 1;
      blockNumber += step;
      if (blockNumber > lastBlock) {
        blockNumber = lastBlock;
      }
    }
    const dailyInfo = await DailyLiquidity.bulkCreate(allData);
    console.log("hi")

    //удаляем запись, которая была 10 дней назад
    await DailyLiquidity.destroy({
      where: {
        [Op.and]: [{
          id: { [Op.ne]: dailyInfo[dailyInfo.length-1].id },
          timestamp: { [Op.between]: [result[0].timestamp, result[1].timestamp] }
        }]
      }
    });
    const priceInfoWQTStartDay = await this.coinGeckoProvider.countUSD(Number(dailyInfo[dailyInfo.length-1].timestamp), "wqt");
    const priceInfoBNBStartDay = await this.coinGeckoProvider.countUSD(Number(dailyInfo[dailyInfo.length-1].timestamp), "bnb");
    const poolToken = Number((Number(dailyInfo[0].bnbPool) * priceInfoBNBStartDay.data.prices[0][1])) + Number((Number(dailyInfo[dailyInfo.length-1].wqtPool) * priceInfoWQTStartDay.data.prices[0][1]));
    await dailyInfo[dailyInfo.length-1].update({
      usdPriceWQT: priceInfoWQTStartDay.data.prices[0][1],
      usdPriceBNB: priceInfoBNBStartDay.data.prices[0][1],
      liquidityPoolUSD: poolToken
    });
  }
}

export async function getLiquidity(r) {
  return(await DailyLiquidity.findAll({limit: r.query.limit, offset: r.query.offset}));
}
