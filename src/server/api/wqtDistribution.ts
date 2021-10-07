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
  config.token.WQT.bscNetwork.name
);

const WBNB = new Token(
  ChainId.MAINNET,
  config.token.WBNB.address,
  config.token.WBNB.decimals,
  config.token.WBNB.symbol,
  config.token.WBNB.name
);

const pair = new Pair(
  new TokenAmount(WQT, config.token.WQT.bscNetwork.amountMax),
  new TokenAmount(WBNB, config.token.WBNB.amountMax)
);

const filePath = path.join('src/server/abi/WQLiquidityMining.json');
const abi: any[] = JSON.parse(fs.readFileSync(filePath).toString()).abi;

export async function wqtDistribution() {
  let priceWQT: any;
  let reserveUSD: any;
  let totalSupply: any;
  let sum: any;
  const provider = new Web3.providers.WebsocketProvider(distributionWQT.provider);
  const web3 = new Web3(provider);
  const tradeContract = new web3.eth.Contract(abi, distributionWQT.contract);
  try {
    await tradeContract.methods.getStakingInfo().call().then(async function(events) {
      const totalStaked = Number(new BigNumber(events.totalStaked).shiftedBy(-18));
      if (!totalStaked) {
        error(Errors.NotFound, 'totalStaked not found', {});
      }

      const rewardTotal = Number(new BigNumber(events.rewardTotal).shiftedBy(-18));
      if (!rewardTotal) {
        error(Errors.NotFound, 'rewardTotal not found', {});
      }

      await axios({
        method: 'GET',
        baseURL: 'https://api.coingecko.com/api/v3/coins/work-quest'
      }).then(function(response) {
        if (response.status !== 200) {
          error(Errors.NotFound, `${response.data}`, {});
        }
        priceWQT = response.data.market_data.current_price.usd;
      });
      if (!priceWQT) {
        error(Errors.NotFound, 'priceWQT not found', {});
      }

      await axios({
        method: 'POST',
        baseURL: 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2',
        data: {
          query: `{ pairDayDatas (first: 1, skip: 0, orderBy:date, orderDirection: desc,
          where: {pairAddress: "${pair.liquidityToken.address.toLowerCase()}"})
        { totalSupply reserveUSD }}`
        }
      }).then(function(response) {
        if (response.status !== 200) {
          error(Errors.NotFound, `${response.data}`, {});
        }
        reserveUSD = response.data.data.pairDayDatas[0].reserveUSD;
        totalSupply = response.data.data.pairDayDatas[0].totalSupply;
      });
      if (!reserveUSD) {
        error(Errors.NotFound, 'ReserveUSD not found', {});
      }
      if (!totalSupply) {
        error(Errors.NotFound, 'TotalSupply not found', {});
      }

      sum = ((rewardTotal * priceWQT) * 12) / (totalStaked * (reserveUSD / totalSupply));
      if (!sum) {
        error(Errors.NotFound, 'Bad value result', {});
      }
    });
  } catch (err) {
    console.log('Error math process', err);
  }
  return output({ sum });
}
