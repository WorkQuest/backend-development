import {config} from "dotenv";

config({ path: __dirname +  '/../../../.env.swapEvent' });

export default {
  contractAddress: process.env.SWAP_EVENT_CONTRACT_ADDRESS,
  wsProvider: process.env.SWAP_EVENT_WEBSOCKET_PROVIDER,
}
