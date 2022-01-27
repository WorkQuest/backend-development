import * as Joi from 'joi';
import * as handlers from '../../api/chat';
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
  chatQuerySchema,
  chatForGetSchema,
  messageTextSchema,
  sortDirectionSchema,
  messagesWithCountSchema,
  chatsForGetWithCountSchema,
  messagesForGetWithCountSchema,
  usersShortWithAdditionalInfoSchema,
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'GET',
    path: '/v1/user/me/chats',
    handler: handlers.getUserChats,
    options: {
      auth: 'jwt-access',
      id: 'v1.me.getChats',
      tags: ['api', 'chat'],
      description: 'Get all chats',
      validate: {
        query: chatQuerySchema,
      },
      response: {
        schema: outputOkSchema(chatsForGetWithCountSchema).label('GetChatsResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/me/chat/{chatId}/messages',
    handler: handlers.getChatMessages,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.getMessages',
      tags: ['api', 'chat'],
      description: 'Get all messages for chat',
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('GetMessagesParams'),
        query: Joi.object({
          starred: Joi.boolean().default(false),
          offset: offsetSchema,
          limit: limitSchema,
          sort: Joi.object({
            createdAt: sortDirectionSchema.default('DESC'),
          })
            .default({ createdAt: 'DESC' })
            .label('SortMessages'),
        }).label('GetMessagesQuery'),
      },
      response: {
        schema: outputOkSchema(messagesForGetWithCountSchema).label('GetMessagesResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/me/chat/{chatId}',
    handler: handlers.getUserChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.user.me.getChat',
      description: 'Get chat',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('GetUserChatParams'),
      },
      response: {
        schema: outputOkSchema(chatForGetSchema).label('GetUserChatResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/me/chat/members/users-by-chats',
    handler: handlers.listOfUsersByChats,
    options: {
      auth: 'jwt-access',
      id: 'v1.user.me.chat.members.getUsersByChats',
      description: 'Get list of users by chats',
      tags: ['api', 'chat'],
      validate: {
        query: Joi.object({
          excludeMembersChatId: idSchema,
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetUsersByChatsQuery'),
      },
      response: {
        schema: outputOkSchema(usersShortWithAdditionalInfoSchema).label('GetUsersByChatsResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/me/chat/group/create',
    handler: handlers.createGroupChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.create',
      description: 'Create new group chat',
      tags: ['api', 'chat'],
      validate: {
        payload: Joi.object({
          name: chatNameSchema.required(),
          memberUserIds: idsSchema.required().min(1).unique(),
        }).label('CreateGroupChatPayload'),
      },
      response: {
        schema: outputOkSchema(chatSchema).label('CreateGroupChatResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/{userId}/send-message',
    handler: handlers.sendMessageToUser,
    options: {
      auth: 'jwt-access',
      id: 'v1.user.sendMessageToUser',
      description: 'Send message to user',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          userId: idSchema.required(),
        }).label('SendMessageToUserParams'),
        payload: Joi.object({
          text: messageTextSchema.allow('').default(''),
          medias: idsSchema.required().unique(),
        }).label('SendMessageToUserPayload'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('SendMessageToUser'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/chat/{chatId}/send-message',
    handler: handlers.sendMessageToChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.sendMessageToChat',
      description: 'Send message to chat',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('SendMessageToChatParams'),
        payload: Joi.object({
          text: messageTextSchema.allow('').default(''),
          medias: idsSchema.required().unique(),
        }).label('SendMessageToChatPayload'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('SendMessageToChatResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/me/chat/group/{chatId}/add',
    handler: handlers.addUsersInGroupChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.addUsers',
      description: 'Add users in group chat. For one or more users',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('AddUserInGroupChatParams'),
        payload: Joi.object({
          userIds: idsSchema.min(1).unique().required(),
        }).label('AddUserInGroupChatPayload'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('AddUserInGroupChatResponse'),
      },
    },
  },
  {
    method: 'DELETE',
    path: '/v1/user/me/chat/group/{chatId}/remove/{userId}',
    handler: handlers.removeUserInGroupChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.removeUser',
      description: 'Remove user from group chat (only for owner)',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
          userId: idSchema.required(),
        }).label('RemoveUserInGroupChatParams'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('RemoveUserInGroupChatResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/me/chat/group/{chatId}/leave',
    handler: handlers.leaveFromGroupChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.leave',
      description: 'Leave from group chat',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('LeaveFromGroupChatParams'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('LeaveFromGroupChatResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/me/chat/group/{chatId}/members',
    handler: handlers.getChatMembers,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.getMembers',
      description: 'Get members in group chat (only for chat members)',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('GetChatMembersParams'),
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetChatMembersQuery'),
      },
      response: {
        schema: outputOkSchema(usersSchema).label('GetChatMembersResponse'), // TODO with count
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/me/chat/messages/star',
    handler: handlers.getUserStarredMessages,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.messages.getStarredMessages',
      description: 'Get starred messages of the user',
      tags: ['api', 'chat'],
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetStarredMessagesQuery'),
      },
      response: {
        schema: outputOkSchema(messagesWithCountSchema).label('GetUserStarredMessagesResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/me/chat/{chatId}/message/{messageId}/star',
    handler: handlers.markMessageStar,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.message.markMessageStar',
      description: 'Mark message star',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          messageId: idSchema,
          chatId: idSchema,
        }).label('MarkMessageStarParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'DELETE',
    path: '/v1/user/me/chat/message/{messageId}/star',
    handler: handlers.removeStarFromMessage,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.message.removeStar',
      description: 'Remove star from message',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          messageId: idSchema.required(),
        }).label('RemoveStarFromMessageParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/me/chat/{chatId}/star',
    handler: handlers.markChatStar,
    options: {
      auth: 'jwt-access',
      id: 'v1.mark.chat',
      description: 'Mark chat by star',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('MarkChatParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'DELETE',
    path: '/v1/user/me/chat/{chatId}/star',
    handler: handlers.removeStarFromChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.remove.star.chat',
      description: 'Remove star from chat',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('RemoveStarParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/read/message/{chatId}',
    handler: handlers.setMessagesAsRead,
    options: {
      auth: 'jwt-access',
      id: 'v1.set.message.read',
      description: 'Set message as read',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('ReadMessageParams'),
        payload: Joi.object({
          messageId: idSchema.required(),
        }).label('LeaveFromGroupChatParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
];
