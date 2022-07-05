import { Chat, ChatMember, Message, User } from "@workquest/database-models/lib/models";

/** Commands */

export interface CreateGroupChatComposCommand {
  userIds: string[],
  chatName: string,
  chatCreator: User

}

export interface RemoveMemberFromGroupChatComposCommand {
  meUser: User,
  chatId: string,
  userId: string,
}

export interface LeaveFromGroupChatComposCommand {
  meUser: User,
  chatId: string,
}

export interface AddUserInGroupChatComposCommand {
  meUser: User,
  chatId: string,
  userIds: string[],
}

export interface SendMessageToUserComposCommand {
  text: string,
  meUser: User,
  userId: string,
  mediaIds: string[],
}

export interface SendMessageToChatComposCommand {
  text: string,
  meUser: User,
  chatId: string,
  mediaIds: string[],
}

export interface RemoveChatFromChatListComposCommand {
  meUser: User,
  chatId: string,
}

export interface SetMessageAsReadComposCommand {
  meUser: User,
  chatId: string,
  messageId: string,
}

export interface MarkMessageStarComposCommand {
  meUser: User,
  chatId: string,
  messageId: string,
}

export interface MarkChatStarComposCommand {
  meUser: User,
  chatId: string,
}

/** Results */

export type CreateGroupChatComposResults = Promise<[
  Chat,
  Message,
]>

export type RemoveMemberFromGroupChatComposResults = Promise<[
  Chat,
  Message,
  ChatMember,
]>

export type LeaveFromGroupChatComposResults = Promise<[
  Chat,
  Message,
  ChatMember,
]>

export type AddUserInGroupChatComposResults = Promise<[
  Chat,
  Message[],
  ChatMember,
]>

export type SendMessageToUserComposResults = Promise<[
  User,
  Message,
]>

export type SendMessageToChatComposResults = Promise<[
  Chat,
  Message,
  ChatMember,
]>

export type RemoveChatFromChatListComposResults = Promise<void>

export type SetMessageAsReadComposResults = Promise<[
  Chat,
  Message,
  ChatMember,
]>

export type MarkMessageStarComposResults = Promise<void>

export type MarkChatStarComposResults = Promise<void>


