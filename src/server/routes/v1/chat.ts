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
  chatNameSchema,
  messagesSchema,
  messageSchema,
  messageTextSchema,
  mediaIdsSchema,
  usersSchema,
} from "@workquest/database-models/lib/schemes";
import {
  getUserChats,
  createGroupChat,
  getChatMessages,
  getUserChat,
  sendMessageToUser,
  sendMessageToChat,
  removeUserInGroupChat,
  addUserInGroupChat,
  leaveFromGroupChat,
  getChatMembers
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
  path: "/v1/user/me/chat/group/create",
  handler: createGroupChat,
  options: {
    id: "v1.chat.group.create",
    description: "Create new group chat",
    tags: ["api", "chat"],
    validate: {
      payload: Joi.object({
        name: chatNameSchema.required(),
        memberUserIds: userIdsSchema.required().min(2).unique().label('UserIds')
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
}, {
  method: "POST",
  path: "/v1/user/me/chat/group/{chatId}/add/{userId}",
  handler: addUserInGroupChat,
  options: {
    id: "v1.chat.group.addUser",
    description: "Add user in group chat",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        chatId: chatIdSchema.required(),
        userId: userIdSchema.required(),
      }).label('AddUserInGroupChatParams')
    },
    response: {
      schema: outputOkSchema(messageSchema).label('AddUserToChatResponse')
    }
  }
}, {
  method: "DELETE",
  path: "/v1/user/me/chat/group/{chatId}/remove/{userId}",
  handler: removeUserInGroupChat,
  options: {
    id: "v1.chat.group.removeUser",
    description: "Remove user from group chat (only for owner)",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        chatId: chatIdSchema.required(),
        userId: userIdSchema.required(),
      }).label('RemoveUserInGroupChatParams')
    },
    response: {
      schema: outputOkSchema(messageSchema).label('RemoveUserFromChatResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/user/me/chat/group/{chatId}/leave",
  handler: leaveFromGroupChat,
  options: {
    id: "v1.chat.group.leave",
    description: "Leave from group chat",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        chatId: chatIdSchema.required(),
      }).label('LeaveFromGroupChatParams')
    },
    response: {
      schema: outputOkSchema(messageSchema).label('RemoveUserFromChatResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/me/chat/group/{chatId}/members",
  handler: getChatMembers,
  options: {
    id: "v1.chat.group.getMembers",
    description: "Get members in group chat (only for chat members)",
    validate: {
      params: Joi.object({
        chatId: chatIdSchema.required(),
      }).label('GetChatMembersParams'),
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetChatMembersQuery')
    },
    response: {
      schema: outputOkSchema(usersSchema).label('GetChatMembersResponse')
    }
  }
}];

