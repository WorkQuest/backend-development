import {config} from "dotenv";

config();

export default {
  bscNetwork: {
    contract: process.env.DAILY_LIQUIDITY_PAIR_CONTRACT_ADDRESS,
    wsProvider: process.env.DAILY_LIQUIDITY_WEBSOCKET_PROVIDER,
    httpsProvider: process.env.DAILY_LIQUIDITY_HTTPS_PROVIDER,
  },
  coinGecko: {
    baseURL: process.env.DAILY_LIQUIDITY_COINGECKO_BASE_URL,
  },
  dbLink: process.env.DB_LINK,
}
