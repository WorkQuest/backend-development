import { createFile, getFiles } from "../../api/forums";
import { fileSchemaInfo, filesQuerySchema } from "../../schemes/media";
import { arrayIdSchema, idSchema, jwtTokens, outputOkSchema } from "../../schemes";
import { chatTest, createChat, getChats } from "../../api/chat";
import * as Joi from "joi";
export default [
  {
    method: "POST",
    path: "/v1/chat/create/",
    handler: createChat,
    options: {
      id: "v1.create.chat",
      description: `Create new chat in DB`,
      tags: ["api", "chat"],
      validate: {
        payload: Joi.object({
          membersId: arrayIdSchema,
          isPrivate: Joi.boolean().label('It`s dialog or chat')
        })
      }
    }
  },
  {
    method: "GET",
    path: "/v1/chats",
    handler: getChats,
    options: {
      id: "v1.chats",
      tags: ["api", "chats"],
      description: "Get all user chats",
      validate: {
        query: filesQuerySchema
      },
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
