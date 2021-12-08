import {config} from "dotenv";

config();

export default {
  bscNetwork: {
    contract: process.env.DAILY_LIQUIDITY_PAIR_CONTRACT_ADDRESS,
    provider: process.env.DAILY_LIQUIDITY_WEBSOCKET_PROVIDER,
  },
  dbLink: process.env.DB_LINK,
}
