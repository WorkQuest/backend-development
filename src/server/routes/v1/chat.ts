
import { chatTest } from "../../api/chat";

export default [{
  method: "GET",
  path: "/chat/create",
  handler: chatTest,
  options: {
      auth: false
  }
}];
