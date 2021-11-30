import BigNumber from "bignumber.js";
import axios from "axios";
import * as path from "path";
import * as fs from "fs";
import { DailyLiquidity } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"
import { from } from "form-data";
const EthDater = require('ethereum-block-by-date');
const Web3 = require('web3');

const providerBNB = 'wss://speedy-nodes-nyc.moralis.io/99c238c237fa12068a89c5c6/bsc/mainnet/ws'
const abiFilePath = path.join(__dirname,'../../../../src/dailyLiquidity/abi/dailyLiquidityAbi.json');
const abiBNB: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi
const contractBNB = '0x3ea2de549ae9dcb7992f91227e8d6629a22c3b40'


export async function apyAllPairs() {
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
    let lastBlockTimestampUTC = new Date(lastBlockTimestamp)
    //получаем начало дня, до которого нужно будет считать
    const startDayToDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 1)).setHours(7,0,0,0));
    let startDayFromDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 10)).setHours(7,0,0,0));
    const endDayToDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate())).setHours(6,59,59,999));
    let endDayFromDate = new Date(new Date(new Date().setDate(lastBlockTimestampUTC.getDate() - 9)).setHours(6,59,59,999));

    let startOfTheDay = await dater.getEvery('days', startDayFromDate.toUTCString(), startDayToDate.toUTCString());
    let endOfTheDay = await dater.getEvery('days', endDayFromDate.toUTCString(), endDayToDate.toUTCString(), 1, false);
    console.log(startOfTheDay);
    console.log(endOfTheDay);
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
      const dailyInfo = await DailyLiquidity.findAndCountAll({
        where: {
          timestamp: {
            [Op.between]: [startOfTheDay[index].timestamp, endOfTheDay[index].timestamp]
          }
        },
        order: [["timestamp", "DESC"]]
      });

      for (let i = 1; i < dailyInfo.count - 1; i ++) {
        await dailyInfo.rows[i].destroy()
      }

      const priceInfoWQTStartDay = await axios.get(`https://api.coingecko.com/api/v3/coins/work-quest/market_chart/range?vs_currency=usd&from=${Number(dailyInfo.rows[0].timestamp) - 1800}&to=${Number(dailyInfo.rows[0].timestamp) + 1800}`, {
        timeout: 10000
      });
      const priceInfoBNBStartDay = await axios.get(`https://api.coingecko.com/api/v3/coins/binancecoin/market_chart/range?vs_currency=usd&from=${Number(dailyInfo.rows[0].timestamp) - 1800}&to=${Number(dailyInfo.rows[0].timestamp) + 1800}`, {
        timeout: 10000
      });
      await dailyInfo.rows[0].update({
        usdPriceWQT: priceInfoWQTStartDay.data.prices[0][1],
        usdPriceBNB: priceInfoBNBStartDay.data.prices[0][1],
      });

      const priceInfoWQTEndDay = await axios.get(`https://api.coingecko.com/api/v3/coins/work-quest/market_chart/range?vs_currency=usd&from=${Number(dailyInfo.rows[1].timestamp) - 1800}&to=${Number(dailyInfo.rows[1].timestamp) + 1800}`, {
        timeout: 10000
      });
      const priceInfoBNBEndDay = await axios.get(`https://api.coingecko.com/api/v3/coins/binancecoin/market_chart/range?vs_currency=usd&from=${Number(dailyInfo.rows[1].timestamp) - 1800}&to=${Number(dailyInfo.rows[1].timestamp) + 1800}`, {
        timeout: 10000
      });
      await dailyInfo.rows[0].update({
        usdPriceWQT: priceInfoWQTEndDay.data.prices[0][1],
        usdPriceBNB: priceInfoBNBEndDay.data.prices[0][1],
      });

      //прайс?
    }
  }
}
