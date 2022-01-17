import {config} from "dotenv";

config({ path: __dirname +  '/../../../.env.syncParser' });

export default {
  contractAddress: process.env.SYNC_PARSER_CONTRACT_ADDRESS,
  wsProvider: process.env.SYNC_PARSER_WEBSOCKET_PROVIDER,
}
