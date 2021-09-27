import { ChainId, Token, TokenAmount, Pair } from "@uniswap/sdk";
import axios from "axios";
import { error, output } from "../utils";
import config from "../config/config";
import { Errors } from "../utils/errors";

const WQT = new Token(
  ChainId.MAINNET,
  config.token.WQT.address,
  config.token.WQT.decimals,
  config.token.WQT.symbol,
  config.token.WQT.name,
);

const WETH = new Token(
  ChainId.MAINNET,
  config.token.WETH.address,
  config.token.WETH.decimals,
  config.token.WETH.symbol,
  config.token.WETH.name
);

const pair = new Pair(
  new TokenAmount(WQT, config.token.WQT.amountMax),
  new TokenAmount(WETH, config.token.WETH.amountMax)
);

const api = axios.create({
  baseURL: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
});

// const { url, params, query } = {
//   url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
//   params: `orderBy: timestamp, orderDirection: desc, where: { pair: "${pair.liquidityToken.address.toLowerCase()}" }`,
//   query: `transaction { id timestamp } pair { txCount }`
// }


export async function getSwaps(r) {
  try {
    const result = await api.post('', {query: `{
        swaps(first:${r.query.limit}, skip:${r.query.offset}, ${`orderBy: timestamp, orderDirection: desc, 
        where: { pair: "${pair.liquidityToken.address.toLowerCase()}" }`} ) { ${`transaction { id timestamp } pair { txCount }`}
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
    const result = await api.post('', {query: `{ 
        mints(first:${r.query.limit}, skip:${r.query.offset}, ${`orderBy: timestamp, orderDirection: desc, 
        where: { pair: "${pair.liquidityToken.address.toLowerCase()}" }`}) { ${`transaction { id timestamp } pair { txCount }`}
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
    const result = await api.post('', {query: `{ 
          burns(first:${r.query.limit}, skip:${r.query.offset}, ${`orderBy: timestamp, orderDirection: desc, 
          where: { pair: "${pair.liquidityToken.address.toLowerCase()}" }`}) { ${`transaction { id timestamp } pair { txCount }`}
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
    const result = await api.post('', {query: `{ 
       pairDayDatas (first: ${r.query.limit}, skip: ${r.query.offset},
        orderBy:date, orderDirection: desc,
        where: {pairAddress: "${pair.liquidityToken.address.toLowerCase()}"})
        { date reserve0 reserve1 totalSupply reserveUSD dailyVolumeToken0
          dailyVolumeToken1 dailyVolumeUSD dailyTxns 
        }`
    });

    if (result.data.errors) {
      return error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return output(result.data.data.tokenDayDatas);
  } catch (err) {
    return error(Errors.LiquidityError, err.response.statusText, err.response.data);
  }
}
