import { ChainId, Token, TokenAmount, Pair } from "@pancakeswap/sdk";
import * as path from 'path';
import * as fs from 'fs';
import axios from "axios";
import config from "../config/config";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import BigNumber from 'bignumber.js';
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

const liquidityMiningProvider = new Web3( new Web3.providers.WebsocketProvider(config.contracts.liquidityMining.webSocketProvider));
const liquidityMiningAbiPath = path.join(__dirname, '../abi/WQLiquidityMining.json');
const liquidityMiningAbi: [] = JSON.parse(fs.readFileSync(liquidityMiningAbiPath).toString()).abi;
const liquidityMiningContract = new liquidityMiningProvider.eth.Contract(liquidityMiningAbi, config.contracts.liquidityMining.contract);

const apiPancakeSwap = axios.create({
  baseURL: 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2'
});

const apiCoingecko = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3/coins/work-quest'
});

export async function getSwaps(r) {
  try {
    const result = await apiPancakeSwap.post('', {
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
    const result = await apiPancakeSwap.post('', {
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
    const result = await apiPancakeSwap.post('', {
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
    const result = await apiPancakeSwap.post('', {
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
  try {
    const stakingInfoEvent = await liquidityMiningContract.methods.getStakingInfo().call();
    const totalStaked = new BigNumber(stakingInfoEvent.totalStaked).shiftedBy(-18).toNumber();
    const rewardTotal = new BigNumber(stakingInfoEvent.rewardTotal).shiftedBy(-18).toNumber();

    const infoLiquidity = await apiCoingecko.get('');
    const currentUsdPrice = infoLiquidity.data.market_data.current_price.usd;

    const responsePairDayDatas = await apiPancakeSwap.post('', {
      query: `{ pairDayDatas (first: 1, skip: 0, orderBy:date, orderDirection: desc,
          where: {pairAddress: "${pair.liquidityToken.address.toLowerCase()}"})
        { totalSupply reserveUSD }}`
    });

    const reserveUSD = responsePairDayDatas.data.data.pairDayDatas[0].reserveUSD;
    const totalSupply = responsePairDayDatas.data.data.pairDayDatas[0].totalSupply;

    const lpToken = (((rewardTotal * currentUsdPrice) * 12) / (totalStaked * (reserveUSD / totalSupply))) * 100;

    return output({ lpToken });
  } catch (err) {
    return error(Errors.LiquidityError, err.response.statusText, err.response.data);
  }
}
