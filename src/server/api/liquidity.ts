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
  const result = await axios({
    url: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2`,
    method: "POST",
    data: {
      query: `{ 
        swaps(orderBy: timestamp, orderDirection: desc, where:
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

  if (result.status !== 200) {
    return error(Errors.LiquidityError, `Liquidity data  swaps error`, {});
  }
  if (result.data.errors) {
    return error(Errors.LiquidityError, '', result.data.errors)
  }

  return output(result.data.data.swaps);
}


export async function getTokenDayData(r) {
  const result = await axios({
    url: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2`,
    method: "POST",
    data: {
      query: `{ 
        tokenDayDatas(orderBy: date, orderDirection: asc,
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

  if (result.status !== 200) {
    return error(Errors.LiquidityError, `Liquidity day data error`, {});
  }
  if (result.data.errors) {
    return error(Errors.LiquidityError, '', result.data.errors)
  }

  return output(result.data.data.tokenDayDatas);
}
