import BigNumber from "bignumber.js";
import axios from "axios";
import * as path from "path";
import * as fs from "fs";
import { DailyLiquidity } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"
import EthDater from 'ethereum-block-by-date';
import Web3 from "web3";
import config from "../../config/config.dailyLiquidity"
import { BridgeProvider } from "../../../bridge/src/BridgeProvider";

const providerBNB = config.bscNetwork.provider
const contractBNB = config.bscNetwork.contract
const abiFilePath = path.join(__dirname,'../../../../src/dailyLiquidity/abi/dailyLiquidityAbi.json');
const abiBNB: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi

//ВЕБ3
//сделай расчёт всего внутри этого класса!!!
export class Web3ProviderHelper {
  public readonly dater;
  constructor(
    public readonly web3: any,
  ) {
    this.web3 = web3;
    this.dater = new EthDater(web3);
  }

  public async getLastBlocks() {
    const result = [];
    const lastBlock = await this.web3.eth.getBlockNumber(console.log);
    let lastBlockTimestamp = Number((await this.web3.eth.getBlock(lastBlock)).timestamp + "000")
    let lastBlockTimestampUTC = new Date(lastBlockTimestamp)
    //получаем начало дня, до которого нужно будет считать
    const startDayToDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 1)).setHours(7,0,0,0));
    let startDayFromDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 10)).setHours(7,0,0,0));
    const endDayToDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate())).setHours(6,59,59,999));
    let endDayFromDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 9)).setHours(6,59,59,999));
    let startOfTheDay = await this.dater.getEvery('days', startDayFromDate.toUTCString(), startDayToDate.toUTCString());
    let endOfTheDay = await this.dater.getEvery('days', endDayFromDate.toUTCString(), endDayToDate.toUTCString(), 1, false);
    result.push(startOfTheDay);
    result.push(endOfTheDay);
  }
}

export class CoinGeckoProvider {
  private readonly api;
  constructor() {
    this.api = 'https://api.coingecko.com/api/v3/coins/'
  }

  async countUSD(timestamp: number, coin: 'wqt' | 'bnb') {
    try {
      if (coin === 'wqt') {
        return await axios.get(`${this.api}` + `work-quest/market_chart/range?vs_currency=usd&from=${timestamp - 1800}&to=${timestamp + 1800}`, {
          timeout: 10000
        });
      } else {
        return await axios.get(`${this.api}` + `binancecoin/market_chart/range?vs_currency=usd&from=${timestamp - 1800}&to=${timestamp + 1800}`, {
          timeout: 10000
        });
      }
    }catch (error) {
      console.log(error);
    }
  }
}

//сюда передаю провайдера и контракт
export class ControllerDailyLiquidity {
  private readonly coinGeckoProvider: CoinGeckoProvider

  constructor(
    private readonly web3ProviderHelper: Web3ProviderHelper,
    private readonly dailyLiquidityContract: any,
  ) {
    this.coinGeckoProvider = new CoinGeckoProvider();
  }

  public async firstStart(providerBNB: string, contractBNB: string) {
    //const provider = new Web3.providers.WebsocketProvider(providerBNB); //**TODO in index */

    const eventsSync = [];
    const methodGetBlock = [];

    const startOfTheDay = (await this.web3ProviderHelper.getLastBlocks())[0]
    const endOfTheDay = (await this.web3ProviderHelper.getLastBlocks())[1]
    let startDayBlock: number;
    let endDayBlock: number;
    let step = 5000;
    for (let index: number = 0; index < startOfTheDay.length; index ++) {
      console.log("start and end day array index:", index);
      startDayBlock = Number(startOfTheDay[index].block);
      endDayBlock = Number(endOfTheDay[index].block);
      for (let blockNumber = startDayBlock+step; blockNumber <= endDayBlock; blockNumber += step) {
        console.log("daily blocks cycle", blockNumber);
        await this.dailyLiquidityContract.getPastEvents('Sync', {
          fromBlock: startDayBlock,
          toBlock: blockNumber,
        }, function(error, event) {
          eventsSync.push(event)
        });
        for(let i = 0; i < eventsSync[0].length; i++) {
          console.log("events between blocks cycle", eventsSync[0][i]);
          const token0 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve0).shiftedBy(-18));
          const token1 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve1).shiftedBy(-18));
          await this.web3ProviderHelper.web3.eth.getBlock(eventsSync[0][i].blockNumber,
            function(error,events) {
              methodGetBlock.push(events)
            });
          const timestamp = Number(methodGetBlock[i].timestamp)
          await DailyLiquidity.create({
            timestamp: timestamp,
            blockNumber: eventsSync[0][i].blockNumber,
            bnbPool: token0,
            wqtPool: token1,
          });
        }
        eventsSync.length = 0; //нужно очищать массив!!!
        startDayBlock = blockNumber;
      }
      const dailyInfo = await DailyLiquidity.findAll({
        where: {
          timestamp: {
            [Op.between]: [startOfTheDay[index].timestamp, endOfTheDay[index].timestamp]
          }
        },
        order: [["timestamp", "DESC"]]
      });

      for (let i = 0; i < dailyInfo.length - 1; i ++) {
        await dailyInfo[i].destroy()
      }

      //TODO


      const priceInfoWQTStartDay = await this.coinGeckoProvider.countUSD(Number(dailyInfo[0].timestamp), "wqt");
      const priceInfoBNBStartDay = await this.coinGeckoProvider.countUSD(Number(dailyInfo[0].timestamp), "bnb");

      const poolToken = Number((Number(dailyInfo[0].bnbPool) * priceInfoBNBStartDay.data.prices[0][1])) + Number((Number(dailyInfo[0].wqtPool) * priceInfoWQTStartDay.data.prices[0][1]));

      await dailyInfo[0].update({
        usdPriceWQT: priceInfoWQTStartDay.data.prices[0][1],
        usdPriceBNB: priceInfoBNBStartDay.data.prices[0][1],
        liquidityPoolUSD: poolToken
      });
    }
  }

  public async startPerDay(providerBNB: string, contractBNB: string) {


    const web3 = new Web3(provider);
    const dater = new EthDater(web3);


    const eventsSync = [];
    const methodGetBlock = [];

    //получаем последний блок и его таймстамп
    const lastBlock = await web3.eth.getBlockNumber(console.log);
    let lastBlockTimestamp = Number((await web3.eth.getBlock(lastBlock)).timestamp + "000")
    let lastBlockTimestampUTC = new Date(lastBlockTimestamp) //последний блок предыдущего дня
    //получаем начало дня, до которого нужно будет считать
    const startPreviousDay = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 1)).setHours(7,0,0,0));
    let endPreviousDay = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 1)).setHours(6,59,59,999));

    let startOfTheDay = await dater.getEvery('days', startPreviousDay.toUTCString(), endPreviousDay.toUTCString());
    let endOfTheDay = await dater.getEvery('days', startPreviousDay.toUTCString(), endPreviousDay.toUTCString(), 1, false);
    let startDayBlock: number;
    let endDayBlock: number;
    let step = 5000;
    for (let index: number = 0; index < startOfTheDay.length; index ++) {
      startDayBlock = Number(startOfTheDay[index].block);
      endDayBlock = Number(endOfTheDay[index].block);
      for (let blockNumber = startDayBlock+step; blockNumber <= endDayBlock; blockNumber += step) {
        await tradeContract.getPastEvents('Sync', {
          fromBlock: startDayBlock,
          toBlock: blockNumber,
        }, function(error, event) {
          eventsSync.push(event)
        });
        for(let i = 0; i < eventsSync[0].length; i++) {
          const token0 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve0).shiftedBy(-18));
          const token1 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve1).shiftedBy(-18));
          await web3.eth.getBlock(eventsSync[0][i].blockNumber,
            function(error,events) {
              methodGetBlock.push(events)
            });
          const timestamp = Number(methodGetBlock[i].timestamp)
          await DailyLiquidity.create({
            timestamp: timestamp,
            blockNumber: eventsSync[0][i].blockNumber,
            bnbPool: token0,
            wqtPool: token1,
          });
        }
        eventsSync.length = 0; //нужно очищать массив!!!
        startDayBlock = blockNumber;
      }
      const dailyInfo = await DailyLiquidity.findAll({
        where: {
          timestamp: {
            [Op.between]: [startOfTheDay[index].timestamp, endOfTheDay[index].timestamp]
          }
        },
        order: [["timestamp", "DESC"]]
      });

      for (let i = 0; i < dailyInfo.length - 1; i ++) {
        await dailyInfo[i].destroy()
      }

      const priceInfoWQTStartDay = await CountDailyLiquidity.countUSD(Number(dailyInfo[0].timestamp), "WQT");
      const priceInfoBNBStartDay = await CountDailyLiquidity.countUSD(Number(dailyInfo[0].timestamp), "BNB");

      const poolToken = Number((Number(dailyInfo[0].bnbPool) * priceInfoBNBStartDay.data.prices[0][1])) + Number((Number(dailyInfo[0].wqtPool) * priceInfoWQTStartDay.data.prices[0][1]));

      await dailyInfo[0].update({
        usdPriceWQT: priceInfoWQTStartDay.data.prices[0][1],
        usdPriceBNB: priceInfoBNBStartDay.data.prices[0][1],
        liquidityPoolUSD: poolToken
      });
    }

    //берём первую запись (которая была сделана 10 дней назад)
    const destroyLiquidity = await DailyLiquidity.findOne({
      order: [["timestamp", "ASC"]]
    });

    await destroyLiquidity.destroy();

    return true;
  }
}

export async function startDailyLiquidity() {
  let lastRecord = await DailyLiquidity.findOne({
    order: [["createdAt", "DESC"]]
  });
  console.log("HERE");

  if(!lastRecord) {
    await firstStart();
  } else {
    await startPerDay();
  }
}

export async function getLiquidity(r) {
  return(await DailyLiquidity.findAll({limit: r.query.limit, offset: r.query.offset}));
}
