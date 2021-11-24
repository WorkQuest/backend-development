import BigNumber from "bignumber.js";
import axios from "axios";
import fs from "fs";
const Web3 = require('web3');
import * as path from "path";

const abiFilePath = path.join(__dirname,'../../../../src/dailyLiquidity/abi/dailyLiquidityAbi.json');
const providerBNB = 'wss://speedy-nodes-nyc.moralis.io/99c238c237fa12068a89c5c6/bsc/mainnet/ws'
const abiBNB: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi
const contractBNB = '0x3ea2de549ae9dcb7992f91227e8d6629a22c3b40'


export async function apyAllPairs() {
  const provider = new Web3.providers.WebsocketProvider(providerBNB);
  const web3 = new Web3(provider);
  const tradeContract = new web3.eth.Contract(abiBNB, contractBNB);

  let eventsSync = []
  let methodGetBlock = []

  const firstBlock = 11335760;
  let toBlock = 11335760;
  try {
    toBlock = toBlock + 6000;
    await tradeContract.getPastEvents('Sync', {
      fromBlock:  firstBlock,
      toBlock: toBlock,
    }, function (error, events) {
      eventsSync = events;
      //console.log(events);
      //console.log(events[events.length-1]);

    })
    for (let i = 0; i < eventsSync.length; i++) {
      const token0 = Number(new BigNumber(eventsSync[i].returnValues.reserve0).shiftedBy(-18))
      const token1 = Number(new BigNumber(eventsSync[i].returnValues.reserve1).shiftedBy(-18))
      await web3.eth.getBlock(eventsSync[i].blockNumber,
        function (error, events) {
          methodGetBlock.push(events)
        })
      const timestamp = Number(methodGetBlock[i].timestamp)

      console.log(token0, token1, timestamp)
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
}

