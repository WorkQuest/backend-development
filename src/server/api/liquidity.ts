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

export async function getSwapsWQT(r) {
  console.log(r.query);
  try {
    const result = await axios({
      url: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2`,
      method: "POST",
      data: {
        query: `{ 
          swaps(first:${r.query.limit}, skip: ${r.query.offset}, orderBy: timestamp, orderDirection: desc, where:
          { pair: "${pair.liquidityToken.address.toLowerCase()}" }) {
            pair {
            token0 {symbol}
            token1 {symbol}
            }
            amount0In
            amount0Out
            amount1In
            amount1Out
            amountUSD
            to
            timestamp
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

export async function getTokenDayData(r) {
  try {
    const result = await axios({
    url: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2`,
    method: "POST",
    data: {
      query: `{ 
        tokenDayDatas(first:${r.query.limit}, skip:${r.query.offset},orderBy: date, orderDirection: asc,
        where: {
          token: "${WQT.address.toLowerCase()}"
          }) {
            id
            date
            priceUSD
            totalLiquidityToken
            totalLiquidityUSD
            totalLiquidityETH
            dailyVolumeETH
            dailyVolumeToken
            dailyVolumeUSD
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
