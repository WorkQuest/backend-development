import {config} from "dotenv";

config({ path: __dirname +  '/../../../.env.WqtWbnb' });

export default {
  contractAddress: process.env.WQT_WBNB_CONTRACT_ADDRESS,
  wsProvider: process.env.WQT_WBNB_WEBSOCKET_PROVIDER,
  parseEventsFromHeight: parseInt(process.env.WQT_WBNB_PARSE_EVENTS_FROM_HEIGHT), // 11335760
}
