import { createFile, getFiles } from "../../api/forums";
import { fileSchemaInfo, filesQuerySchema } from "../../schemes/media";
import { outputOkSchema } from "../../schemes";
import { chatTest, createChat } from "../../api/chat";
import * as Joi from "joi";
import { chatSchemaCreate } from "../../schemes/chat";

export default [
  {
    method: "POST",
    path: "v1/chat/create",
    handler: createChat,
    options: {
      id: "v1.create.chat",
      description: `Create new chat in DB`,
      tags: ["api", "chat"],
      validate: {
        payload: Joi.object({
          file: chatSchemaCreate.required()
        })
      }
    }
  },

  // {
  //   method: "GET",
  //   path: "/chat/create/",
  //   handler: chatTest,
  //   options: {
  //     auth: false
  //   }
  // }
];
