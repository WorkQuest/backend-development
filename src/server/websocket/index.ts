import { chatSubscriptionOption } from "./websocket.chat";
import { questSubscriptionOption } from "./websocket.quest";

export default function init(server) {
  server.subscription(chatSubscriptionOption);
  server.subscription(questSubscriptionOption);
}
