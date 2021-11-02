import * as Joi from "joi";
import {
  idSchema,
  idsSchema,
  chatSchema,
  limitSchema,
  usersSchema,
  offsetSchema,
  emptyOkSchema,
  messageSchema,
  outputOkSchema,
  chatNameSchema,
  chatForGetSchema,
  messageTextSchema,
  messagesWithCountSchema,
  chatsForGetWithCountSchema,
  messagesForGetWithCountSchema,
  usersShortWithAdditionalInfoSchema,
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
  removeStarFromChat,
  markChatStar,
  setMessagesAsRead,
  getUserStarredMessages,
  removeStarFromMessage,
  getChatMembers,
  markMessageStar,
  listOfUsersByChats,
} from "../../api/chat";

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
        starred: Joi.boolean().default(false),
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetChatsQuery')
    },
    response: {
      schema: outputOkSchema(chatsForGetWithCountSchema).label('GetChatsResponse'),
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
        chatId: idSchema.required(),
      }).label('GetMessagesParams'),
      query: Joi.object({
        starred: Joi.boolean().default(false),
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetMessagesQuery')
    },
    response: {
      schema: outputOkSchema(messagesForGetWithCountSchema).label('GetMessagesResponse')
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
        chatId: idSchema.required()
      }).label('GetUserChatParams')
    },
    response: {
      schema: outputOkSchema(chatForGetSchema).label('GetUserChatResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/me/chat/members/users-by-chats",
  handler: listOfUsersByChats,
  options: {
    id: "v1.user.me.chat.members.getUsersByChats",
    description: "Get list of users by chats",
    tags: ["api", "chat"],
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetUsersByChatsQuery'),
    },
    response: {
      schema: outputOkSchema(usersShortWithAdditionalInfoSchema).label('GetUsersByChatsResponse')
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
        memberUserIds: idsSchema.required().min(2).unique(),
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
        userId: idSchema.required(),
      }).label('SendMessageToUserParams'),
      payload: Joi.object({
        text: messageTextSchema.default(''),
        medias: idsSchema.required().unique(),
      }).label('SendMessageToUserPayload')
    },
    response: {
      schema: outputOkSchema(messageSchema).label('SendMessageToUser')
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
        chatId: idSchema.required(),
      }).label('SendMessageToChatParams'),
      payload: Joi.object({
        text: messageTextSchema.default(''),
        medias: idsSchema.required().unique(),
      }).label('SendMessageToChatPayload'),
    },
    response: {
      schema: outputOkSchema(messageSchema).label('SendMessageToChat')
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
        chatId: idSchema.required(),
        userId: idSchema.required(),
      }).label('AddUserInGroupChatParams')
    },
    response: {
      schema: outputOkSchema(messageSchema).label('AddUserInGroupChatResponse')
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
        chatId: idSchema.required(),
        userId: idSchema.required(),
      }).label('RemoveUserInGroupChatParams')
    },
    response: {
      schema: outputOkSchema(messageSchema).label('RemoveUserInGroupChatResponse')
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
        chatId: idSchema.required(),
      }).label('LeaveFromGroupChatParams')
    },
    response: {
      schema: outputOkSchema(messageSchema).label('LeaveFromGroupChatResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/me/chat/group/{chatId}/members",
  handler: getChatMembers,
  options: {
    id: "v1.chat.group.getMembers",
    description: "Get members in group chat (only for chat members)",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        chatId: idSchema.required(),
      }).label('GetChatMembersParams'),
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetChatMembersQuery')
    },
    response: {
      schema: outputOkSchema(usersSchema).label('GetChatMembersResponse') // TODO with count
    }
  }
}, {
  method: "GET",
  path: "/v1/user/me/chat/messages/star",
  handler: getUserStarredMessages,
  options: {
    id: "v1.chat.messages.getStarredMessages",
    description: "Get starred messages of the user",
    tags: ["api", "chat"],
    validate: {
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label('GetStarredMessagesQuery')
    },
    response: {
      schema: outputOkSchema(messagesWithCountSchema).label('GetUserStarredMessagesResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/user/me/chat/{chatId}/message/{messageId}/star",
  handler: markMessageStar,
  options: {
    id: "v1.chat.message.markMessageStar",
    description: "Mark message star",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        messageId: idSchema,
        chatId: idSchema,
      }).label('MarkMessageStarParams')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/user/me/chat/message/{messageId}/star",
  handler: removeStarFromMessage,
  options: {
    id: "v1.chat.message.removeStar",
    description: "Remove star from message",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        messageId: idSchema.required(),
      }).label('RemoveStarFromMessageParams'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/user/me/chat/{chatId}/star",
  handler: markChatStar,
  options: {
    id: "v1.mark.chat",
    description: "Mark chat by star",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        chatId: idSchema.required(),
      }).label('MarkChatParams'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/user/me/chat/{chatId}/star",
  handler: removeStarFromChat,
  options: {
    id: "v1.remove.star.chat",
    description: "Remove star from chat",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        chatId: idSchema.required(),
      }).label('RemoveStarParams'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/read/message/{chatId}",
  handler: setMessagesAsRead,
  options: {
    id: "v1.set.message.read",
    description: "Set message as read",
    tags: ["api", "chat"],
    validate: {
      params: Joi.object({
        chatId: idSchema.required(),
      }).label('ReadMessageParams'),
      payload: Joi.object({
        messageId: idSchema.required(),
      }).label('LeaveFromGroupChatParams')
    },
    response: {
      schema: outputOkSchema(messageSchema).label('LeaveFromGroupChatResponse')
    }
  }
}];

