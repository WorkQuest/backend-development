import { ChainId, Token, TokenAmount, Pair } from "@pancakeswap/sdk";
import axios from "axios";
import config from "../config/config";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";

const WQT = new Token(
  ChainId.MAINNET,
  config.token.WQT.bscAddress,
  config.token.WQT.decimals,
  config.token.WQT.symbol,
  config.token.WQT.name,
);

const WBNB = new Token(
  ChainId.MAINNET,
  config.token.WBNB.address,
  config.token.WBNB.decimals,
  config.token.WBNB.symbol,
  config.token.WBNB.name
);

const pair = new Pair(
  new TokenAmount(WQT, config.token.WQT.amountMax),
  new TokenAmount(WBNB, config.token.WBNB.amountMax)
);

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
