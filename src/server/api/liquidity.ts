import { ChainId, Token, TokenAmount, Pair } from "@uniswap/sdk";
import axios from "axios";
import { output } from "../utils";


const WQT = new Token(
  ChainId.MAINNET,
  "0x06677dc4fe12d3ba3c7ccfd0df8cd45e4d4095bf",
  18,
  "WQT",
  "Work quest Token"
);
const ETH = new Token(
  ChainId.MAINNET,
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  18,
  "ETH",
  "Ether (Wrapped)"
);

const pair = new Pair(
  new TokenAmount(WQT, "2000000000000000000"),
  new TokenAmount(ETH, "1000000000000000000")
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
