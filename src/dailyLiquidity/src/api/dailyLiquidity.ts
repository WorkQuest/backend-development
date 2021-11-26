import BigNumber from "bignumber.js";
import axios from "axios";
import fs from "fs";
const Web3 = require('web3');
import * as path from "path";
import { DailyLiquidity } from "@workquest/database-models/lib/models";

const abiFilePath = path.join(__dirname,'../../../../src/dailyLiquidity/abi/dailyLiquidityAbi.json');
const providerBNB = 'wss://speedy-nodes-nyc.moralis.io/99c238c237fa12068a89c5c6/bsc/mainnet/ws'
const abiBNB: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi
const contractBNB = '0x3ea2de549ae9dcb7992f91227e8d6629a22c3b40'

async function countUSDT() {
  const dailyLiquidities = await DailyLiquidity.findAll({
    order: [["timestamp", "DESC"]]
  });

  const fromTime = Number(dailyLiquidities[dailyLiquidities.length - 1].timestamp) - 1800
  const toTime = Number(dailyLiquidities[0].timestamp) + 1800

  const priceInfoWQT = await axios.get(`https://api.coingecko.com/api/v3/coins/work-quest/market_chart/range?vs_currency=usd&from=${fromTime}&to=${toTime}`, {
    timeout: 15000
  });



  console.log(priceInfoWQT.data.prices);
  /*  const priceInfoBNB = await axios.get(`https://api.coingecko.com/api/v3/coins/binancecoin/market_chart/range?vs_currency=usd&from=${fromTime - 1800}&to=${toTime + 1800}`, {
      timeout: 10000
    });
    const poolToken = (token0 * priceInfoBNB.data.prices[0][1]) + (token1 * priceInfoWQT.data.prices[0][1])*/
}


export async function apyAllPairs() {
  const provider = new Web3.providers.WebsocketProvider(providerBNB);
  const web3 = new Web3(provider);
  const tradeContract = new web3.eth.Contract(abiBNB, contractBNB);

  let eventsSync = []
  let methodGetBlock = []
  const blockStep = 6000;

  const firstBlock = 11943329;
  let toBlock = firstBlock + blockStep;

  //while(toBlock < 12962267) {
  try {
    await tradeContract.getPastEvents('Sync', {
      fromBlock:  11945611,//12180208,
      toBlock: 12983903,

    }, function (error, events) {
      eventsSync.push(events)
    })
    for (let i = 0; i < eventsSync[0].length; i++) {
      const token0 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve0).shiftedBy(-18))
      const token1 = Number(new BigNumber(eventsSync[0][i].returnValues.reserve1).shiftedBy(-18))
      await web3.eth.getBlock(eventsSync[0][i].blockNumber,
        function (error, events) {
          methodGetBlock.push(events)
        })
      const timestamp = Number(methodGetBlock[i].timestamp)
      // console.log(token0, token1, timestamp)
      const priceInfoWQT = await axios.get(`https://api.coingecko.com/api/v3/coins/work-quest/market_chart/range?vs_currency=usd&from=${timestamp - 1800}&to=${timestamp + 1800}`, {
        timeout: 10000
      });
      const priceInfoBNB = await axios.get(`https://api.coingecko.com/api/v3/coins/binancecoin/market_chart/range?vs_currency=usd&from=${timestamp - 1800}&to=${timestamp + 1800}`, {
        timeout: 10000
      });
      const poolToken = (token0 * priceInfoBNB.data.prices[0][1]) + (token1 * priceInfoWQT.data.prices[0][1])
      console.log(poolToken, timestamp)
    }
  } catch (err) {
    console.log(err)
  }
  toBlock += blockStep;
  //}
  await countUSDT()
}

export async function getLiquidity() {

}

