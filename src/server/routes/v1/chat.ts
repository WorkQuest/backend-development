import { createFile, getFiles } from "../../api/forums";
import { fileSchemaInfo, filesQuerySchema } from "../../schemes/media";
import { arrayIdSchema, idSchema, jwtTokens, outputOkSchema } from "../../schemes";
import {
  addFavorite,
  createChat,
  deleteMessage,
  getChats,
  getMessages,
  removeFavorite,
  sendMessage
} from "../../api/chat";
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
  {
    method: "GET",
    path: "/v1/chat/{chatId}",
    handler: getMessages,
    options: {
      id: "v1.chats.messages",
      tags: ["api", "chats"],
      description: "Get all messages for concrete chat",
    }
  },
  {
    method: "POST",
    path: "/v1/chat/{chatId}/send",
    handler: sendMessage,
    options: {
      id: "v1.send.message",
      description: `Create new message in DB`,
      tags: ["api", "chat", "messages"],
      validate: {
        params: Joi.object({
          chatId: Joi.string().required(),
        }),
        payload: Joi.object({
          data: Joi.string(),
          file: Joi.array().optional()
        })
      }
    }
  },
  {
    method: "POST",
    path: "/v1/chat/{chatId}/delete/{messageId}",
    handler: deleteMessage,
    options: {
      id: "v1.delete.message",
      description: `Delete message for all or for author only`,
      tags: ["api", "chat", "messages"],
      validate: {
        params: Joi.object({
          chatId: Joi.string().required(),
          messageId: Joi.string().required()
        }),
        payload: Joi.object({
          onlyAuthor: Joi.boolean(),
        })
      }
    }
  },
  {
    method: "POST",
    path: "/v1/chat/{chatId}/addfavorite/{messageId}",
    handler: addFavorite,
    options: {
      id: "v1.add.favorite.message",
      description: `Add favorite message to user`,
      tags: ["api", "chat", "messages"],
      validate: {
        params: Joi.object({
          chatId: Joi.string().required(),
          messageId: Joi.string().required()
        })
      }
    }
  },
  {
    method: "POST",
    path: "/v1/chat/delfavorite/{messageId}",
    handler: removeFavorite,
    options: {
      id: "v1.delete.favorite.message",
      description: `Delete favorite message`,
      tags: ["api", "chat", "messages"],
      validate: {
        params: Joi.object({
          messageId: Joi.string().required()
        }),
      }
    }
  },
];
