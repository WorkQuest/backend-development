import {config} from "dotenv";

config({ path: __dirname +  '/../../../.env.quest'});

export default {
  debug: process.env.BRIDGE_DEBUG === "true",
  workQuestDevNetwork: {
    parseEventsFromHeight: parseInt(process.env.QUEST_WQ_DEVNETWORK_PARSE_EVENTS_FROM_HEIGHT),
    contract: process.env.QUEST_WQ_DEVNETWORK_CONTRACT,
    webSocketProvider: process.env.QUEST_WQ_DEVNETWORK_WEBSOCKET_PROVIDER,
  },
}
