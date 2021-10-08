import { ChainId, Token, TokenAmount, Pair } from "@pancakeswap/sdk";
import * as path from 'path';
import * as fs from 'fs';
import axios from "axios";
import config from "../config/config";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import BigNumber from 'bignumber.js';
const Web3 = require('web3')

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

const provider = new Web3( new Web3.providers.WebsocketProvider(config.distribution.providerLink));
const filePath = path.join('src/server/abi/WQLiquidityMining.json');
const abi: any[] = JSON.parse(fs.readFileSync(filePath).toString()).abi;
const tradeContract = new provider.eth.Contract(abi, config.distribution.contractAddress);

const api = axios.create({
  baseURL: 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2'
});

export async function getSwaps(r) {
  try {
    const result = await api.post('', {
      query: `{
        swaps(first:${r.query.limit}, skip:${r.query.offset}, orderBy: timestamp, orderDirection: desc, 
        where: { pair: "${pair.liquidityToken.address.toLowerCase()}" }) 
        { transaction { id timestamp } 
        amount0In amount0Out amount1In amount1Out amountUSD to } }`
    });

    if (result.data.errors) {
      return error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return output(result.data.data.swaps);
  } catch (err) {
    return error(Errors.LiquidityError, err.response.statusText, err.response.data);
  }
}

export async function getMints(r) {
  try {
    const result = await api.post('', {
      query: `{ 
        mints(first:${r.query.limit}, skip:${r.query.offset}, orderBy: timestamp, orderDirection: desc, 
        where: { pair: "${pair.liquidityToken.address.toLowerCase()}" }) {
        transaction { id timestamp } 
        to liquidity amount0 amount1 amountUSD } }`
    });

    if (result.data.errors) {
      return error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return output(result.data.data.mints);
  } catch (err) {
    return error(Errors.LiquidityError, err.response.statusText, err.response.data);
  }
}

export async function getBurns(r) {
  try {
    const result = await api.post('', {
      query: `{
        burns(first:${r.query.limit}, skip:${r.query.offset}, orderBy: timestamp, orderDirection: desc,
        where: { pair: "${pair.liquidityToken.address.toLowerCase()}" })
        { transaction { id timestamp }
        to liquidity amount0 amount1 amountUSD } }`
    });

    if (result.data.errors) {
      return error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return output(result.data.data.burns);
  } catch (err) {
    return error(Errors.LiquidityError, err.response.statusText, err.response.data);
  }
}

export async function getTokenDayData(r) {
  try {
    const result = await api.post('', {
      query: `{ 
        pairDayDatas (first: ${r.query.limit}, skip: ${r.query.offset},
        orderBy:date, orderDirection: desc,
        where: {pairAddress: "${pair.liquidityToken.address.toLowerCase()}"})
        { date reserve0 reserve1 totalSupply reserveUSD dailyVolumeToken0
          dailyVolumeToken1 dailyVolumeUSD dailyTxns 
        }}`
    });

    if (result.data.errors) {
      return error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return output(result.data.data.pairDayDatas);
  } catch (err) {
    return error(Errors.LiquidityError, err.response.statusText, err.response.data);
  }
}

export async function getDistribution() {
  let priceWQT: any;
  let reserveUSD: any;
  let totalSupply: any;
  let sum: any;

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
      console.log(sum);
    });
  } catch (err) {
    console.log('Error math process', err);
  }
  return output({ sum });
}
