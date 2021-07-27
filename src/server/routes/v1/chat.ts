import { getFiles } from "../../api/forums";
import { filesQuerySchema } from "../../schemes/media";
import { outputOkSchema } from "../../schemes";
import { chatTest } from "../../api/Chat";

export default [
  {
    method: 'GET',
    path: '/chat/create/',
    handler: chatTest,
    options: {
      auth: false
    }
  }
];
