import { config } from 'dotenv';

config();

export default {
  debug: process.env.BRIDGE_DEBUG === "true",
  rinkebyTestNetwork: {
    parseEventsFrom: parseInt(process.env.PROPOSAL_RINKEBY__PARSE_EVENTS_FROM_HEIGHT),
    contract: process.env.PROPOSAL_RINKEBY_CONTRACT,
    webSocketProvider: process.env.PROPOSAL_RINKEBY_WEBSOCKET
  },
  privateKey: process.env.BRIDGE_CONTRACT_PRIVAT_KEY,

};
