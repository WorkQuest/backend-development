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

const WBNB = new Token(
  ChainId.MAINNET,
  config.token.WETH.address,
  config.token.WETH.decimals,
  config.token.WETH.symbol,
  config.token.WETH.name
);

const pair = new Pair(
  new TokenAmount(WQT, config.token.WQT.amountMax),
  new TokenAmount(WBNB, config.token.WBNB.amountMax)
);

const { url, params, query } = {
  url: 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2',
  params: `orderBy: timestamp, orderDirection: desc, where: { pair: "${pair.liquidityToken.address.toLowerCase()}" }`,
  query: `transaction { id timestamp } pair { txCount }`
}


export async function getSwaps(r) {
  try {
    const result = await axios({
      url: url,
      method: 'POST',
      data: {
        query: `{ 
          swaps(first:${r.query.limit}, skip:${r.query.offset}, ${params} ) {
            ${query}
            amount0In amount0Out amount1In amount1Out amountUSD to
          }
        }`
      }
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
    const result = await axios({
      url: url,
      method: "POST",
      data: {
        query: `{ 
          mints(first:${r.query.limit}, skip:${r.query.offset}, ${params}) {
            ${query}
            to liquidity amount0 amount1 amountUSD
          }
        }`
      }
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
    const result = await axios({
      url: url,
      method: "POST",
      data: {
        query: `{ 
          burns(first:${r.query.limit}, skip:${r.query.offset}, ${params}) {
            ${query}
            to liquidity amount0 amount1 amountUSD
          }
        }`
      }
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
    const result = await axios({
      url: url,
      method: "POST",
      data: {
        query: `{ 
        tokenDayDatas(first:${r.query.limit}, skip:${r.query.offset},orderBy: date, orderDirection: desc,
        where: {
          token: "${WQT.address.toLowerCase()}"
          }) { id date priceUSD totalLiquidityToken totalLiquidityUSD totalLiquidityETH
            dailyVolumeETH dailyVolumeToken dailyVolumeUSD
        }
      }`
      }
    });

    if (result.data.errors) {
      return error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return output(result.data.data.tokenDayDatas);
  } catch (err) {
    return error(Errors.LiquidityError, err.response.statusText, err.response.data);
  }
}
