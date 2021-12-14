import { config } from 'dotenv';

config();

export default {
  debug: process.env.BRIDGE_DEBUG === "true",
  rinkebyTestNetwork: {
    parseEventsFrom: parseInt(process.env.PROPOSAL_RINKEBY_PARSE_EVENTS_FROM_HEIGHT),
    contract: process.env.PROPOSAL_RINKEBY_CONTRACT,
    webSocketProvider: process.env.PROPOSAL_RINKEBY_WEBSOCKET_PROVIDER,
  },
};
