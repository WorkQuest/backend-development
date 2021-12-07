import {config} from "dotenv";

config();

export default {
  bscNetwork: {
    contract: process.env.DAILY_LIQUIDITY_PAIR_CONTRACT_ADDRESS,
    provider: process.env.BRIDGE_ETH_MAINNETWORK_WEBSOCKET_PROVIDER,
  }
}
