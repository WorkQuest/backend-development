import * as path from 'path';
import * as fs from 'fs';
import { distributionWQT } from '../config/constant';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { ChainId, Pair, Token, TokenAmount } from '@pancakeswap/sdk';
import config from '../config/config';

const Web3 = require('web3');

const WQT = new Token(
  ChainId.MAINNET,
  config.token.WQT.bscNetwork.address,
  config.token.WQT.bscNetwork.decimals,
  config.token.WQT.bscNetwork.symbol,
  config.token.WQT.bscNetwork.name,
);

const WBNB = new Token(
  ChainId.MAINNET,
  config.token.WBNB.address,
  config.token.WBNB.decimals,
  config.token.WBNB.symbol,
  config.token.WBNB.name,
);

const pair = new Pair(
  new TokenAmount(WQT, config.token.WQT.bscNetwork.amountMax),
  new TokenAmount(WBNB, config.token.WBNB.amountMax)
);

const filePath = path.join('src/server/abi/WQLiquidityMining.json');
const abi: any[] = JSON.parse(fs.readFileSync(filePath).toString()).abi;

export async function wqtDistribution() {
  const provider = new Web3.providers.WebsocketProvider(distributionWQT.provider);
  const web3 = new Web3(provider);
  const tradeContract = new web3.eth.Contract(abi, distributionWQT.contract);
  try {
    await tradeContract.methods.getStakingInfo().call().then(async function(events, err) {
      const totalStaked = Number(new BigNumber(events.totalStaked).shiftedBy(-18));
      const rewardTotal = Number(new BigNumber(events.rewardTotal).shiftedBy(-18));
      const priceUSD: any = (await axios.get(`https://api.coingecko.com/api/v3/coins/work-quest`)).data.market_data.current_price.usd;
      const result = await axios.post('https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2', {
        query: `{ 
        pairDayDatas (first: 1, skip: 0,
        orderBy:date, orderDirection: desc,
        where: {pairAddress: "${pair.liquidityToken.address.toLowerCase()}"})
        { date reserve0 reserve1 totalSupply reserveUSD dailyVolumeToken0
          dailyVolumeToken1 dailyVolumeUSD dailyTxns 
        }}`
      });

      if (result.data.errors) {
        return error(Errors.LiquidityError, 'Query error', result.data.errors);
      }
      const reserveUSD = result.data.data.pairDayDatas[0].reserveUSD
      const totalSupply = result.data.data.pairDayDatas[0].totalSupply
      console.log("priceUSD",priceUSD,"rewardTotal", rewardTotal,"totalStaked", totalStaked,"reserveUSD", reserveUSD,"totalSupply", totalSupply);
      const sum = ((rewardTotal * priceUSD) * 12)/(totalStaked * (reserveUSD/totalSupply))
      console.log(sum);
      return sum
    });
  } catch (err) {
    console.log('Error math process', err)
  }
}

