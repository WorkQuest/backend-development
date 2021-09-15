import { ChainId, Token, TokenAmount, Pair } from "@uniswap/sdk";
import axios from "axios";
import { output } from "../utils";
import config from "../config/config";


const WQT = new Token(
  ChainId.MAINNET,
  config.token.addressWQT,
  Number(config.token.decimalsWQT),
  config.token.symbolWQT,
  config.token.nameWQT,
);
const WETH = new Token(
  ChainId.MAINNET,
  config.token.addressWETH,
  Number(config.token.decimalsWETH),
  config.token.symbolWETH,
  config.token.nameWETH
);

const pair = new Pair(
  new TokenAmount(WQT, config.token.amountWQTMax),
  new TokenAmount(WETH, config.token.amountWETHMax)
);

export async function getSwapsWQT() {

  const r = await axios({
    url: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2`,
    method: "post",
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
  const swap = r.data.data.swaps;

  if (r.status !== 200) {
    return r.statusText;
  }
  return output(swap);
}


export async function getTokenDayData() {

  const r = await axios({
    url: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2`,
    method: "post",
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

  const token = r.data.data.tokenDayDatas;

  if (r.status !== 200) {
    return r.statusText;
  }
  return output(token);
}
