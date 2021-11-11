export const enum ChatNotificationActions {
  /** Group chat */
  groupChatCreate = 'groupChatCreate',
  groupChatAddUser = 'groupChatAddUser',
  groupChatDeleteUser = 'groupChatDeleteUser',
  groupChatLeaveUser = 'groupChatLeaveUser',
  /** */
  messageReadByRecipient = 'messageReadByRecipient',
  newMessage = 'newMessage',
}

const chatSubscriptionFilter = async function (path, notification, options): Promise<boolean> {
  return notification.recipients.includes(options.credentials.id);
}

export const chatSubscriptionOption = {
  subscription: "/notifications/chat",
  option: { filter: chatSubscriptionFilter },
}

export async function publishChatNotifications(server, event: { recipients: string[], action: ChatNotificationActions, data: any } ) {
  return server.publish(chatSubscriptionOption.subscription, event);
}


