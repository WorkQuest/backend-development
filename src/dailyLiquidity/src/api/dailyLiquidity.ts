import BigNumber from "bignumber.js";
import axios from "axios";
import * as path from "path";
import * as fs from "fs";
import { DailyLiquidity } from "@workquest/database-models/lib/models";
import {Op} from "sequelize"

const Web3 = require('web3');

const providerBNB = 'wss://speedy-nodes-nyc.moralis.io/99c238c237fa12068a89c5c6/bsc/mainnet/ws'
const abiFilePath = path.join(__dirname,'../../../../src/dailyLiquidity/abi/dailyLiquidityAbi.json');
const abiBNB: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi
const contractBNB = '0x3ea2de549ae9dcb7992f91227e8d6629a22c3b40'

async function countUSDT() {
  // console.log(token0, token1, timestamp)
  /*      const priceInfoWQT = await axios.get(`https://api.coingecko.com/api/v3/coins/work-quest/market_chart/range?vs_currency=usd&from=${timestamp - 1800}&to=${timestamp + 1800}`, {
          timeout: 10000
        });
        const priceInfoBNB = await axios.get(`https://api.coingecko.com/api/v3/coins/binancecoin/market_chart/range?vs_currency=usd&from=${timestamp - 1800}&to=${timestamp + 1800}`, {
          timeout: 10000
        });*/
  //const poolToken = (token0 * priceInfoBNB.data.prices[0][1]) + (token1 * priceInfoWQT.data.prices[0][1])
  //console.log(poolToken, timestamp)

/*  const dailyLiquidities = await DailyLiquidity.findAll({
    order: [["timestamp", "DESC"]]
  });

  const fromTime = Number(dailyLiquidities[dailyLiquidities.length - 1].timestamp) - 1800
  const toTime = Number(dailyLiquidities[0].timestamp) + 1800

  const priceInfoWQT = await axios.get(`https://api.coingecko.com/api/v3/coins/work-quest/market_chart/range?vs_currency=usd&from=${fromTime}&to=${toTime}`, {
    timeout: 15000
  });

  console.log(priceInfoWQT.data.prices);
    const priceInfoBNB = await axios.get(`https://api.coingecko.com/api/v3/coins/binancecoin/market_chart/range?vs_currency=usd&from=${fromTime - 1800}&to=${toTime + 1800}`, {
      timeout: 10000
    });
    const poolToken = (token0 * priceInfoBNB.data.prices[0][1]) + (token1 * priceInfoWQT.data.prices[0][1])*/
}

export async function apyAllPairs() {
  const provider = new Web3.providers.WebsocketProvider(providerBNB);
  const web3 = new Web3(provider);
  const tradeContract = new web3.eth.Contract(abiBNB, contractBNB);

  const eventsSync = []
  const methodGetBlock = []

  const lastRecord = await DailyLiquidity.findOne({
    //order: [["createdAt", "DESK"]]
  });
  const step = 5000; //because can get only 6000 per one request
  const fromBlock = lastRecord.blockNumber;
  let toBlock = fromBlock + step;
  while (toBlock <= fromBlock + 11000) {
    try {
      await tradeContract.getPastEvents('Sync', {
        fromBlock:  13028122 ,
        toBlock: 13040036,
      }, function (error, events) {
        eventsSync.push(events)
      });

      for (let i = 0; i < eventsSync[0].length; i++) {
        const token0 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve0).shiftedBy(-18))
        const token1 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve1).shiftedBy(-18))
        await web3.eth.getBlock(eventsSync[0][i].blockNumber,
          function (error, events) {
            methodGetBlock.push(events)
          });
        const timestamp = Number(methodGetBlock[i].timestamp)
        await DailyLiquidity.create({
          timestamp: timestamp,
          blockNumber: eventsSync[0][i].blockNumber,
          bnbPool: token0,
          wqtPool: token1,
        }).catch(e => {
          console.log(e);
        });
      }
    } catch (err) {
      console.log(err)
    }
    toBlock += step;
  }

  //тут время с 7 утра по нашему и с 00 по unix, но это правильно, потому что createdAt у нас будет в 7 утра, а  не в 12 ночи
  const dayStart = new Date(new Date().setUTCHours(0, 0, 0, 0));

  const extraData = await DailyLiquidity.findAll({ where: {createdAt: {[Op.gte]: dayStart }} });



  await countUSDT();
}
