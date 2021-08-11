import * as Joi from "joi";
import {
  emptyOkSchema,
  outputOkSchema,
  limitSchema,
  offsetSchema,
  idSchema,
  chatsSchema,
  userIdsSchema,
  chatSchema,
  messagesSchema,
  messageTextSchema,
  mediaIdsSchema,
} from "@workquest/database-models/lib/schemes";
import {
  getUserChats,
  createGroupChat,
  getChatMessages,
  getUserChat,
  sendMessageToUser,
  sendMessageToChat,
} from "../../api/chat";

const userIdSchema = idSchema.label('UserId');
const chatIdSchema = idSchema.label('ChatId');

export default [{
  method: "GET",
  path: "/v1/user/me/chats",
  handler: getUserChats,
  options: {
    id: "v1.me.getChats",
    tags: ["api", "chat"],
    description: "Get all chats",
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetChatsQuery')
    },
    response: {
      schema: outputOkSchema(chatsSchema).label('GetChatsResponse'),
    }
  }
}, {
  method: "GET",
  path: "/v1/user/me/chat/{chatId}/messages",
  handler: getChatMessages,
  options: {
    id: "v1.chat.getMessages",
    tags: ["api", "chat"],
    description: "Get all messages for chat",
    validate: {
      params: Joi.object({
        chatId: chatIdSchema.required(),
      }).label('GetMessagesParams'),
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetMessagesQuery')
    },
    response: {
      schema: outputOkSchema(messagesSchema).label('GetMessagesResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/me/chat/{chatId}",
  handler: getUserChat,
  options: {
    id: "v1.user.me.getChat",
    description: "Get chat",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        chatId: chatIdSchema.required()
      }).label('GetUserChatParams')
    },
    response: {
      schema: outputOkSchema(chatSchema).label('GetUserChatResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/user/me/chat/create-group",
  handler: createGroupChat,
  options: {
    id: "v1.chat.group.create",
    description: "Create new group chat",
    tags: ["api", "chat"],
    validate: {
      payload: Joi.object({
        memberUserIds: userIdsSchema.required().unique().label('UserIds')
      }).label('CreateGroupChatPayload')
    },
    response: {
      schema: outputOkSchema(chatSchema).label('CreateGroupChatResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/user/{userId}/send-message",
  handler: sendMessageToUser,
  options: {
    id: "v1.user.sendMessageToUser",
    description: "Send message to user",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        userId: userIdSchema.required(),
      }).label('SendMessageToUserParams'),
      payload: Joi.object({
        text: messageTextSchema.default(''),
        medias: mediaIdsSchema.required().unique().label("Medias"),
      }).label('SendMessageToUserPayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/chat/{chatId}/send-message",
  handler: sendMessageToChat,
  options: {
    id: "v1.chat.sendMessageToChat",
    description: "Send message to chat",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        chatId: chatIdSchema.required(),
      }).label('SendMessageToChatParams'),
      payload: Joi.object({
        text: messageTextSchema.default(''),
        medias: mediaIdsSchema.required().unique().label("Medias"),
      }).label('SendMessageToChatPayload'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];

// TODO вложенные сообщения
// TODO add/delete user in group chat
