import { chatSubscriptionOption } from "./websocket.chat";

export default function init(server) {
  server.subscription(chatSubscriptionOption);
}
