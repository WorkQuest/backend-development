import {addJob} from "../utils/scheduler";
import { ChatMember, DailyLiquidity } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"
import { Helpers } from "graphile-worker";
import Web3 from "web3";
import BigNumber from "bignumber.js";
import axios from "axios";
import * as path from "path";
import * as fs from "fs";
const EthDater = require('ethereum-block-by-date');
const providerBNB = 'wss://speedy-nodes-nyc.moralis.io/99c238c237fa12068a89c5c6/bsc/mainnet/ws'
const abiFilePath = path.join(__dirname,'../../../src/dailyLiquidity/abi/dailyLiquidityAbi.json');
console.log(abiFilePath);
const abiBNB: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi
const contractBNB = '0x3ea2de549ae9dcb7992f91227e8d6629a22c3b40'

export type UnreadMessageIncrementPayload = {
  chatId: string;
  notifierUserId?: string;
}

export async function cleanPoolDataJob(payload: UnreadMessageIncrementPayload) {
  return addJob("cleanPoolData", payload);
}

export default async function cleanPoolData(payload: UnreadMessageIncrementPayload, h: Helpers) {
  const provider = new Web3.providers.WebsocketProvider(providerBNB);
  const web3 = new Web3(provider);
  const dater = new EthDater(web3)
  const tradeContract = new web3.eth.Contract(abiBNB, contractBNB);

  const eventsSync = [];
  const methodGetBlock = [];

  let lastRecord = await DailyLiquidity.findOne({
    order: [["createdAt", "DESC"]]
  });

  //значит, первый запуск и нужно получить инфу за предыдущие 10 дней
  if(!lastRecord) {
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
    for (let index: number = 0; index < startOfTheDay.length; index += 1) {
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
        eventsSync.slice(0,eventsSync.length);
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

      const priceInfoWQTStartDay = await axios.get(`https://api.coingecko.com/api/v3/coins/work-quest/market_chart/range?vs_currency=usd&from=${Number(dailyInfo[0].timestamp) - 1800}&to=${Number(dailyInfo[0].timestamp) + 1800}`, {
        timeout: 10000
      });
      const priceInfoBNBStartDay = await axios.get(`https://api.coingecko.com/api/v3/coins/binancecoin/market_chart/range?vs_currency=usd&from=${Number(dailyInfo[0].timestamp) - 1800}&to=${Number(dailyInfo[0].timestamp) + 1800}`, {
        timeout: 10000
      });
      const poolToken = Number((Number(dailyInfo[0].bnbPool) * priceInfoBNBStartDay.data.prices[0][1])) + Number((Number(dailyInfo[0].wqtPool) * priceInfoWQTStartDay.data.prices[0][1]));

      await dailyInfo[0].update({
        usdPriceWQT: priceInfoWQTStartDay.data.prices[0][1],
        usdPriceBNB: priceInfoBNBStartDay.data.prices[0][1],
        liquidityPoolUSD: poolToken
      });
    }
  }

  //берём первую запись (которая была сделана 10 дней назад)
  const destroyLiquidity = await DailyLiquidity.findOne({
    order: [["timestamp", "ASC"]]
  });

  await destroyLiquidity.destroy();

  const netStartDate = new Date(new Date().setUTCHours(0, 0, 0, 0)).toUTCString() //без обёртки в new Date() время будет в Unix - шедулер не заупстится
  await addJob('cleanPoolData', {  }, { 'run_at': netStartDate})
}

